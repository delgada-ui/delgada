use colored::*;
use std::{fs, io, path::Path, process};

pub fn remove_dir_contents(dir: &String) {
  let dir_path = Path::new(&dir);
  if dir_path.exists() {
    std::fs::remove_dir_all(dir_path).unwrap();
  }
  std::fs::create_dir_all(dir_path).unwrap();
}

// Given a directory path, create that directory if it doesn't exist.
pub fn create_dir(dir: &String) {
  let dir_path = Path::new(&dir);
  if !dir_path.exists() {
    std::fs::create_dir_all(dir_path).unwrap();
  }
}

pub fn copy_assets_to_build(assets_path_string: &String, build_dir: &String) {
  if Path::new(&assets_path_string).exists() {
    let assets_build_path = format!("{}/assets", build_dir);
    copy_dir_all(&assets_path_string, &assets_build_path).unwrap_or_else(|err| {
      println!(
        "{}: Problem copying assets directory at '{}' to build: {}\n",
        "Error".red().bold(),
        assets_path_string,
        err
      );
      process::exit(1);
    });
  }
}

fn copy_dir_all(src: impl AsRef<Path>, dst: impl AsRef<Path>) -> io::Result<()> {
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
