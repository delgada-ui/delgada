use kuchiki::{ElementData, NodeDataRef, NodeRef};
use std::{
  collections::BTreeMap,
  path::{Component, Path, PathBuf},
};

pub fn component_replace(
  component_name: &str,
  html: &mut NodeRef,
  callback: impl Fn(&NodeRef) -> (Option<Vec<NodeRef>>, String, String),
) -> (String, String) {
  let mut css = "".to_string();
  let mut js = "".to_string();

  let replace = |node: NodeDataRef<ElementData>| -> (String, String) {
    let (new_node_list, imported_css, imported_js) = callback(node.as_node());
    for new_node in new_node_list.unwrap() {
      node.as_node().insert_after(new_node);
    }
    node.as_node().detach();
    (imported_css, imported_js)
  };

  for node in html.select(component_name).unwrap().collect::<Vec<_>>() {
    let (imported_css, imported_js) = replace(node);

    // If multiple component instances exist do not duplicate component styles
    if !css.contains(&imported_css) {
      css += &imported_css;
    }
    // If multiple component instances exist do not duplicate component logic
    if !js.contains(&imported_js) {
      js += &imported_js;
    }
  }

  (css, js)
}

pub fn get_imported_component_paths(html: &NodeRef) -> BTreeMap<String, String> {
  let mut imported_components = BTreeMap::<String, String>::new();

  for child in html.inclusive_descendants() {
    if let Some(comment) = child.into_comment_ref() {
      let mut comment_string = comment.as_node().to_string();
      if comment_string.contains("import") {
        comment_string = comment_string.strip_prefix("<!--").unwrap().to_string();
        comment_string = comment_string.strip_suffix("-->").unwrap().to_string();
        let imports: Vec<&str> = comment_string.split("\n").collect();
        for import in imports {
          let mut import_string = import.to_string();
          if import_string.contains("import") {
            remove_whitespace(&mut import_string);
            let imported_component_path = import_string
              .strip_prefix("import")
              .unwrap()
              .to_string()
              .replace("'", "");
            let imported_component_path = normalize_path(Path::new(&imported_component_path));
            let imported_component_tag_name = Path::new(&imported_component_path)
              .file_stem()
              .unwrap()
              .to_str()
              .unwrap()
              .to_string();
            imported_components.insert(
              imported_component_tag_name,
              imported_component_path.to_str().unwrap().to_string(),
            );
          }
        }
      }
      comment.as_node().detach();
    }
  }

  imported_components
}

fn remove_whitespace(s: &mut String) {
  s.retain(|c| !c.is_whitespace());
}

pub fn normalize_path(path: &Path) -> PathBuf {
  let mut components = path.components().peekable();
  let mut ret = if let Some(c @ Component::Prefix(..)) = components.peek().cloned() {
    components.next();
    PathBuf::from(c.as_os_str())
  } else {
    PathBuf::new()
  };

  for component in components {
    match component {
      Component::Prefix(..) => unreachable!(),
      Component::RootDir => {
        ret.push(component.as_os_str());
      }
      Component::CurDir => {}
      Component::ParentDir => {
        ret.pop();
      }
      Component::Normal(c) => {
        ret.push(c);
      }
    }
  }
  ret
}
