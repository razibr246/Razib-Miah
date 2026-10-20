//! Geometry for the Quantum ML card: a geodesic sphere (an icosahedron with each face split into
//! n×n triangles, pushed out onto the unit sphere) that turns and tips toward the viewer.
//!
//! The page calls `build` once, then `project` every frame. `project` writes five numbers per edge
//! into this module's memory: start x, start y, end x, end y, and depth (positive means the edge
//! faces the viewer). JavaScript reads them straight from that memory and draws the SVG paths, so
//! no strings cross the boundary.

use std::ptr::addr_of_mut;

/// How far the sphere tips toward the viewer, in radians, so its top shows.
const TIP: f32 = 0.42;

struct Mesh {
    pts: Vec<[f32; 3]>,
    edges: Vec<(u16, u16)>,
    out: Vec<f32>,
}

static mut MESH: Mesh = Mesh { pts: Vec::new(), edges: Vec::new(), out: Vec::new() };

// WebAssembly runs this module on one thread, so one shared mesh is enough.
fn mesh() -> &'static mut Mesh {
    unsafe { &mut *addr_of_mut!(MESH) }
}

/// Returns the index of the point on the unit sphere in direction `p`, adding it if it's new.
/// Neighboring faces share their edge points, so near-equal points are treated as one.
fn vertex(pts: &mut Vec<[f32; 3]>, p: [f32; 3]) -> u16 {
    let l = (p[0] * p[0] + p[1] * p[1] + p[2] * p[2]).sqrt();
    let q = [p[0] / l, p[1] / l, p[2] / l];
    let same = |v: &[f32; 3]| (0..3).all(|d| (v[d] - q[d]).abs() < 1e-4);
    if let Some(i) = pts.iter().position(same) {
        return i as u16;
    }
    pts.push(q);
    (pts.len() - 1) as u16
}

/// Builds the sphere with each icosahedron face split `n` times, and returns how many edges it has.
#[no_mangle]
pub extern "C" fn build(n: u32) -> u32 {
    let t = (1.0 + 5f32.sqrt()) / 2.0;
    let v: [[f32; 3]; 12] = [
        [-1.0, t, 0.0], [1.0, t, 0.0], [-1.0, -t, 0.0], [1.0, -t, 0.0],
        [0.0, -1.0, t], [0.0, 1.0, t], [0.0, -1.0, -t], [0.0, 1.0, -t],
        [t, 0.0, -1.0], [t, 0.0, 1.0], [-t, 0.0, -1.0], [-t, 0.0, 1.0],
    ];
    let faces: [[usize; 3]; 20] = [
        [0, 11, 5], [0, 5, 1], [0, 1, 7], [0, 7, 10], [0, 10, 11],
        [1, 5, 9], [5, 11, 4], [11, 10, 2], [10, 7, 6], [7, 1, 8],
        [3, 9, 4], [3, 4, 2], [3, 2, 6], [3, 6, 8], [3, 8, 9],
        [4, 9, 5], [2, 4, 11], [6, 2, 10], [8, 6, 7], [9, 8, 1],
    ];
    let m = mesh();
    m.pts.clear();
    m.edges.clear();
    let n = n.clamp(1, 8) as i32;
    let nf = n as f32;
    for [ia, ib, ic] in faces {
        let (a, b, c) = (v[ia], v[ib], v[ic]);
        // the point i steps toward b and j steps toward c from corner a
        let at = |pts: &mut Vec<[f32; 3]>, i: i32, j: i32| {
            let (i, j) = (i as f32 / nf, j as f32 / nf);
            vertex(pts, [0, 1, 2].map(|d| a[d] + (b[d] - a[d]) * i + (c[d] - a[d]) * j))
        };
        for i in 0..n {
            for j in 0..(n - i) {
                let p = at(&mut m.pts, i, j);
                let q = at(&mut m.pts, i + 1, j);
                let r = at(&mut m.pts, i, j + 1);
                for (x, y) in [(p, q), (p, r), (q, r)] {
                    let e = if x < y { (x, y) } else { (y, x) };
                    if x != y && !m.edges.contains(&e) {
                        m.edges.push(e);
                    }
                }
            }
        }
    }
    m.out = vec![0.0; m.edges.len() * 5];
    m.edges.len() as u32
}

/// Turns the sphere by `angle` around its vertical axis, tips it toward the viewer, and flattens it
/// onto a circle of radius `r` centered at (`cx`, `cy`). Returns where the edge numbers start.
#[no_mangle]
pub extern "C" fn project(angle: f32, cx: f32, cy: f32, r: f32) -> *const f32 {
    let m = mesh();
    let (sa, ca) = angle.sin_cos();
    let (st, ct) = TIP.sin_cos();
    let flat = |p: [f32; 3]| {
        let x1 = p[0] * ca + p[2] * sa;
        let z1 = -p[0] * sa + p[2] * ca;
        [cx + r * x1, cy - r * (p[1] * ct - z1 * st), p[1] * st + z1 * ct]
    };
    for (k, &(i, j)) in m.edges.iter().enumerate() {
        let p = flat(m.pts[i as usize]);
        let q = flat(m.pts[j as usize]);
        m.out[k * 5..k * 5 + 5].copy_from_slice(&[p[0], p[1], q[0], q[1], p[2] + q[2]]);
    }
    m.out.as_ptr()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Mutex;

    // The native test runner uses several threads; the shared mesh is meant for one, so tests take turns.
    static TURN: Mutex<()> = Mutex::new(());

    #[test]
    fn geodesic_counts_match_the_formula() {
        let _turn = TURN.lock().unwrap();
        // a sphere split n times per face has 10n²+2 points and 30n² edges
        for n in 1..=4u32 {
            assert_eq!(build(n), 30 * n * n);
            assert_eq!(mesh().pts.len() as u32, 10 * n * n + 2);
        }
    }

    #[test]
    fn projected_points_stay_on_the_disc() {
        let _turn = TURN.lock().unwrap();
        let edges = build(3) as usize;
        let ptr = project(1.1, 100.0, 80.0, 50.0);
        let out = unsafe { std::slice::from_raw_parts(ptr, edges * 5) };
        for e in out.chunks(5) {
            for (x, y) in [(e[0], e[1]), (e[2], e[3])] {
                assert!(((x - 100.0).powi(2) + (y - 80.0).powi(2)).sqrt() <= 50.01);
            }
        }
        // about half the sphere faces the viewer
        let front = out.chunks(5).filter(|e| e[4] >= 0.0).count();
        assert!(front > edges / 3 && front < edges * 2 / 3);
    }
}
