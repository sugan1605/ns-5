/** Room layout in metres. Origin: floor centre; +z points toward the camera. */
export const ROOM = {
  width: 8,
  depth: 6,
  height: 3.2,
  backZ: -3,
  window: { x0: -2.4, x1: 2.4, y0: 0.55, y1: 2.55 },
};

/** Where NS-5 may wander on his own (keeps clear of furniture). */
export const WANDER = { x0: -2.3, x1: 1.5, z0: -1.8, z1: 1.1 };

export const DESK = { x0: 2.86, x1: 3.9, z0: -1.75, z1: -0.15, height: 0.62 };
export const CHAIR = { x: 2.64, z: -0.95, seat: 0.36 };
/** Standing spot in front of the chair, and the heading that faces the desk (+x). */
export const DESK_APPROACH = { x: 2.2, z: -0.95 };
export const DESK_HEADING = Math.PI / 2;
/** Point NS-5 looks at while typing (centre of the monitor). */
export const MONITOR = { x: 3.6, y: 0.9, z: -0.95 };

/** Height above the chair seat the robot root rises to when seated. */
export const SEAT_LIFT = 0.23;
