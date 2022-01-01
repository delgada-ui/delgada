use colored::*;
use kuchiki::parse_html;
use kuchiki::{traits::*, NodeRef};
use std::{fs, io::ErrorKind, path::Path, process};

pub fn parse(path: &Path) -> NodeRef {
  let path_str = path.to_str().unwrap();
  let html = read_file_to_string(path_str).unwrap_or_else(|err| {
    println!(
      "{}: Problem parsing file at '{}': {}\n",
      "Error".red().bold(),
      path_str,
      err
    );
    process::exit(1);
  });
  parse_html().one(html)
}

fn read_file_to_string(path: &str) -> Result<String, &str> {
  match fs::read_to_string(path) {
    Ok(file_string) => Ok(file_string),
    Err(error) => {
      if error.kind() == ErrorKind::NotFound {
        Err("No such file or directory")
      } else {
        Err("Problem opening the file")
      }
    }
  }
}
