use std::path::Path;

// Clear the build directory if it exists and create a
// new build directory if it does not
pub fn clear_dir(build_dir: &String) {
  let build_dir_path = Path::new(&build_dir);
  if build_dir_path.exists() {
    std::fs::remove_dir_all(build_dir_path).unwrap();
  }
  std::fs::create_dir_all(build_dir_path).unwrap();
}
