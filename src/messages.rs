use colored::*;
use std::{time::Duration};

pub fn compiling(entry_dir: &String) {
  println!(
    "{} source code starting at {}/index.html",
    "Compiling".green().bold(),
    entry_dir
  );
}

pub fn finished(elapsed: Duration) {
  println!("{} build in {:.2?}\n", "Finished".green().bold(), elapsed);
}
