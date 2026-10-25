// 41 Blythe on the Samsung TV: Home Assistant's lights, scenes, Yale lock and Lorex cameras, worked with the remote.
// Plain ES2017 for the 2020 Tizen web engine (no ?. or ??). Reads GET /api/states every few seconds and calls
// light/switch toggle and scene.turn_on. The lock is shown only: a TV remote never unlocks a door.
(function () {
  'use strict';

  var CFG = window.BLYTHE_CONFIG || {};
  var POLL_MS = (CFG.pollSeconds || 5) * 1000;
  var CAMERA_MS = (CFG.cameraSeconds || 3) * 1000;
  var KEY = { LEFT: 37, UP: 38, RIGHT: 39, DOWN: 40, ENTER: 13, BACK: 10009, ESC: 27, BACKSPACE: 8 };

  var states = {};          // entity_id → state object
  var focused = null;       // the focused element
  var fullCamera = null;    // entity_id shown full screen
  var toastTimer = null;
  var fullTimer = null;

  // ---- Home Assistant ----

  function api(method, path, body) {
    if (CFG.demo) return demo.api(method, path, body);
    return fetch(CFG.url.replace(/\/$/, '') + path, {
      method: method,
      headers: { 'Authorization': 'Bearer ' + CFG.token, 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined
    }).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  function refresh() {
    return api('GET', '/api/states').then(function (list) {
      states = {};
      list.forEach(function (s) { states[s.entity_id] = s; });
      setStatus('');
      render();
    }).catch(function (e) {
      setStatus(e.message === 'HTTP 401' ? 'Home Assistant refused the token' : 'Can\'t reach Home Assistant, retrying');
    });
  }

  function callService(domain, service, entityId) {
    return api('POST', '/api/services/' + domain + '/' + service, { entity_id: entityId })
      .then(function () { setTimeout(refresh, 400); })
      .catch(function () { toast('That didn\'t go through. Try again.'); });
  }

  // ---- What to show ----

  function ids(prefixes) {
    return Object.keys(states).filter(function (id) {
      return prefixes.some(function (p) { return id.indexOf(p + '.') === 0; });
    }).sort(function (a, b) { return name(a).localeCompare(name(b)); });
  }
  function pick(list, prefixes, max) {
    return (list || ids(prefixes)).filter(function (id) { return states[id]; }).slice(0, max);
  }
  function name(id) {
    var s = states[id];
    return (s && s.attributes.friendly_name) || id.split('.')[1].replace(/_/g, ' ');
  }
  function stateOf(id) { return states[id] ? states[id].state : 'unavailable'; }

  // ---- Rendering ----

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }

  // Reuses each entity's element between refreshes so focus and camera pictures don't flicker.
  function keyed(container, id, build) {
    var e = container.querySelector('[data-id="' + id + '"]');
    if (!e) {
      e = build();
      e.setAttribute('data-id', id);
      container.appendChild(e);
    }
    return e;
  }
  function prune(container, keep) {
    Array.prototype.slice.call(container.children).forEach(function (c) {
      var id = c.getAttribute('data-id');
      if (id && keep.indexOf(id) < 0) container.removeChild(c);
    });
  }

  function render() {
    renderDoor();
    renderCameras();
    renderTiles('lights', pick(CFG.lights, ['light', 'switch'], 12), lightText);
    renderTiles('scenes', pick(CFG.scenes, ['scene'], 6), function () { return 'Run'; });
    if (!focused || !document.body.contains(focused)) focus(document.querySelector('.focusable'));
  }

  function renderDoor() {
    var box = document.getElementById('door');
    var lockId = CFG.lock || ids(['lock'])[0];
    var lock = stateOf(lockId);
    var html = '<div class="label">Front door</div>' +
      '<div class="lock focusable ' + lock + '" data-id="' + lockId + '" data-kind="lock">' +
      '<div class="state">' + ({ locked: 'Locked', unlocked: 'Unlocked', jammed: 'Jammed', locking: 'Locking…',
        unlocking: 'Unlocking…' }[lock] || 'Lock unavailable') + '</div>' +
      '<div class="note">Yale · lock and unlock from your phone</div></div><div class="facts">';
    if (states[CFG.lockBattery]) html += 'Battery <b>' + stateOf(CFG.lockBattery) + ' %</b><br>';
    if (states[CFG.doorPerson]) {
      html += stateOf(CFG.doorPerson) === 'on'
        ? '<span class="alert">Someone is at the door</span>' : 'No one at the door';
    }
    html += '</div>';
    var wasFocused = focused && focused.getAttribute('data-kind') === 'lock';
    box.innerHTML = html;
    if (wasFocused) focus(box.querySelector('.lock'));
  }

  function renderCameras() {
    var box = document.getElementById('cameras');
    var list = pick(CFG.cameras, ['camera'], 4);
    prune(box, list);
    list.forEach(function (id) {
      var tile = keyed(box, id, function () {
        var t = el('div', 'cam focusable');
        t.setAttribute('data-kind', 'camera');
        t.appendChild(el('img'));
        t.appendChild(el('div', 'name'));
        return t;
      });
      tile.querySelector('.name').textContent = name(id);
    });
  }

  function lightText(id) {
    var s = states[id];
    if (!s || s.state === 'unavailable') return 'Unavailable';
    if (s.state !== 'on') return 'Off';
    var b = s.attributes.brightness;
    return b ? 'On · ' + Math.round(b / 2.55) + ' %' : 'On';
  }

  function renderTiles(boxId, list, text) {
    var box = document.getElementById(boxId);
    prune(box, list);
    list.forEach(function (id) {
      var tile = keyed(box, id, function () {
        var t = el('div', 'tile focusable');
        t.setAttribute('data-kind', id.split('.')[0]);
        t.appendChild(el('div', 'name'));
        t.appendChild(el('div', 'state'));
        return t;
      });
      tile.querySelector('.name').textContent = name(id);
      tile.querySelector('.state').textContent = text(id);
      tile.classList.toggle('on', stateOf(id) === 'on');
      tile.classList.toggle('unavailable', stateOf(id) === 'unavailable');
    });
  }

  // Camera pictures come from entity_picture (/api/camera_proxy/...?token=...), which carries its own
  // short-lived access token, so a plain <img> can load it.
  function cameraUrl(id) {
    if (CFG.demo) return demo.picture(id);
    var s = states[id];
    var pic = s && s.attributes.entity_picture;
    if (!pic) return '';
    return CFG.url.replace(/\/$/, '') + pic + (pic.indexOf('?') < 0 ? '?' : '&') + 't=' + Date.now();
  }
  function refreshCameras() {
    if (fullCamera) return;
    Array.prototype.forEach.call(document.querySelectorAll('.cam'), function (c) {
      var url = cameraUrl(c.getAttribute('data-id'));
      if (url) c.querySelector('img').src = url;
    });
  }

  // ---- Focus and the remote ----

  function focus(e) {
    if (!e) return;
    if (focused) focused.classList.remove('focused');
    focused = e;
    e.classList.add('focused');
  }

  // Moves to the nearest focusable element in the pressed direction.
  function move(dx, dy) {
    if (!focused) return focus(document.querySelector('.focusable'));
    var from = focused.getBoundingClientRect();
    var fx = from.left + from.width / 2, fy = from.top + from.height / 2;
    var best = null, bestScore = Infinity;
    Array.prototype.forEach.call(document.querySelectorAll('.focusable'), function (c) {
      if (c === focused) return;
      var r = c.getBoundingClientRect();
      var cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      var along = dx ? (cx - fx) * dx : (cy - fy) * dy;
      var across = dx ? Math.abs(cy - fy) : Math.abs(cx - fx);
      if (along <= 1) return;
      var score = along + across * 2;
      if (score < bestScore) { bestScore = score; best = c; }
    });
    if (best) focus(best);
  }

  function activate() {
    if (!focused) return;
    var id = focused.getAttribute('data-id');
    var kind = focused.getAttribute('data-kind');
    if (kind === 'light' || kind === 'switch') return callService(kind, 'toggle', id);
    if (kind === 'scene') { toast(name(id)); return callService('scene', 'turn_on', id); }
    if (kind === 'camera') return openCamera(id);
    if (kind === 'lock') return toast('Lock and unlock the door from your phone.');
  }

  function openCamera(id) {
    fullCamera = id;
    document.getElementById('full-name').textContent = name(id);
    document.getElementById('full').classList.remove('hidden');
    tickFull();
  }
  function tickFull() {
    clearTimeout(fullTimer);
    if (!fullCamera) return;
    document.getElementById('full-img').src = cameraUrl(fullCamera);
    fullTimer = setTimeout(tickFull, 1000);
  }
  function closeCamera() {
    fullCamera = null;
    clearTimeout(fullTimer);
    document.getElementById('full').classList.add('hidden');
    refreshCameras();
  }

  function back() {
    if (fullCamera) return closeCamera();
    if (window.tizen) {
      try { window.tizen.application.getCurrentApplication().exit(); } catch (e) { /* not on a TV */ }
    }
  }

  document.addEventListener('keydown', function (e) {
    switch (e.keyCode) {
      case KEY.LEFT: if (!fullCamera) move(-1, 0); break;
      case KEY.RIGHT: if (!fullCamera) move(1, 0); break;
      case KEY.UP: if (!fullCamera) move(0, -1); break;
      case KEY.DOWN: if (!fullCamera) move(0, 1); break;
      case KEY.ENTER: if (fullCamera) closeCamera(); else activate(); break;
      case KEY.BACK: case KEY.ESC: case KEY.BACKSPACE: back(); break;
      default: return;
    }
    e.preventDefault();
  });

  // ---- Bits ----

  function setStatus(text) { document.getElementById('status').textContent = text; }
  function toast(text) {
    var t = document.getElementById('toast');
    t.textContent = text;
    t.classList.remove('hidden');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.add('hidden'); }, 2500);
  }
  function clock() {
    var d = new Date();
    var h = d.getHours(), m = d.getMinutes();
    document.getElementById('time').textContent = ((h + 11) % 12 + 1) + ':' + (m < 10 ? '0' : '') + m + (h < 12 ? ' AM' : ' PM');
    document.getElementById('date').textContent = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday',
      'Saturday'][d.getDay()] + ', ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
      'September', 'October', 'November', 'December'][d.getMonth()] + ' ' + d.getDate();
  }

  // ---- Demo house, for trying the app without Home Assistant ----

  var demo = (function () {
    var house = [
      ['lock.front_door', 'locked', { friendly_name: 'Front door' }],
      ['sensor.front_door_battery', '86', { friendly_name: 'Front door battery' }],
      ['binary_sensor.front_door_person_occupancy', 'off', { friendly_name: 'Front door person' }],
      ['camera.front_door', 'idle', { friendly_name: 'Front door' }],
      ['camera.driveway', 'idle', { friendly_name: 'Driveway' }],
      ['camera.backyard', 'idle', { friendly_name: 'Backyard' }],
      ['camera.side_yard', 'idle', { friendly_name: 'Side yard' }],
      ['light.living_room', 'on', { friendly_name: 'Living room', brightness: 178 }],
      ['light.kitchen', 'on', { friendly_name: 'Kitchen', brightness: 255 }],
      ['light.dining_room', 'off', { friendly_name: 'Dining room' }],
      ['light.hallway', 'off', { friendly_name: 'Hallway' }],
      ['light.porch', 'off', { friendly_name: 'Porch' }],
      ['light.bedroom', 'off', { friendly_name: 'Bedroom' }],
      ['scene.movie_time', 'scening', { friendly_name: 'Movie time' }],
      ['scene.all_off', 'scening', { friendly_name: 'All lights off' }]
    ].map(function (r) { return { entity_id: r[0], state: r[1], attributes: r[2] }; });
    var colors = { front_door: '#2c4a6e', driveway: '#3d5a3a', backyard: '#5a4a2c', side_yard: '#4a2c5a' };
    return {
      api: function (method, path, body) {
        if (method === 'POST' && body) {
          house.forEach(function (s) {
            if (s.entity_id === body.entity_id && /\/toggle$/.test(path)) s.state = s.state === 'on' ? 'off' : 'on';
          });
        }
        return Promise.resolve(method === 'GET' ? JSON.parse(JSON.stringify(house)) : []);
      },
      picture: function (id) {
        var key = id.split('.')[1];
        var t = new Date().toTimeString().slice(0, 8);
        var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="' +
          (colors[key] || '#333') + '"/><text x="24" y="44" fill="#fff" font-family="monospace" font-size="24">' +
          'DEMO ' + key.toUpperCase() + ' ' + t + '</text></svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
      }
    };
  })();

  // ---- Start ----

  document.getElementById('title').textContent = CFG.title || '41 Blythe';
  if (!CFG.demo && (!CFG.url || !CFG.token)) setStatus('Missing config.js: copy config.example.js and fill it in');
  clock();
  setInterval(clock, 15000);
  refresh().then(refreshCameras);
  setInterval(refresh, POLL_MS);
  setInterval(refreshCameras, CAMERA_MS);
})();
