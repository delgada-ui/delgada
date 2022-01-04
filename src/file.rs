use std::{fs, io, path::Path};

// Clear the build directory if it exists and create a
// new build directory if it does not
pub fn clear_dir(build_dir: &String) {
  let build_dir_path = Path::new(&build_dir);
  if build_dir_path.exists() {
    std::fs::remove_dir_all(build_dir_path).unwrap();
  }
  std::fs::create_dir_all(build_dir_path).unwrap();
}

pub fn copy_dir_all(src: impl AsRef<Path>, dst: impl AsRef<Path>) -> io::Result<()> {
  fs::create_dir_all(&dst)?;
  for entry in fs::read_dir(src)? {
    let entry = entry?;
    let ty = entry.file_type()?;
    if ty.is_dir() {
      copy_dir_all(entry.path(), dst.as_ref().join(entry.file_name()))?;
    } else {
      fs::copy(entry.path(), dst.as_ref().join(entry.file_name()))?;
    }
  }
  Ok(())
}
