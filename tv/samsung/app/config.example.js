// Copy to config.js (git-ignored) before building. The token is packed into the app on the TV only.
window.BLYTHE_CONFIG = {
  url: "http://192.168.1.10:8123",          // the hub, by IP
  token: "PASTE-A-LONG-LIVED-TOKEN",        // Home Assistant → profile → Security → Long-lived access tokens
  title: "41 Blythe",

  // Leave a list out to show every entity of that kind.
  lock: "lock.front_door",
  lockBattery: "sensor.front_door_battery",
  doorPerson: "binary_sensor.front_door_person_occupancy",
  cameras: ["camera.front_door", "camera.driveway", "camera.backyard", "camera.side_yard"],
  // lights: ["light.living_room", "light.kitchen"],
  // scenes: ["scene.movie_time", "scene.all_off"],

  pollSeconds: 5,      // how often states refresh
  cameraSeconds: 3,    // how often camera pictures refresh (1 s in full screen)
  demo: false          // true: made-up house, no Home Assistant needed (for trying the app)
};
