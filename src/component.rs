use kuchiki::{ElementData, NodeDataRef, NodeRef};
use std::path::Path;

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

pub fn get_imported_component_paths(
  html: &NodeRef,
  imported_components: &mut Vec<String>,
  component_base_path: &str,
) {
  for child in html.inclusive_descendants() {
    if let Some(comment) = child.into_comment_ref() {
      let mut comment_string = comment.as_node().to_string();

      if comment_string.contains("import") {
        comment_string = comment_string
          .strip_prefix("<!--")
          .unwrap()
          .to_string()
          .strip_suffix("-->")
          .unwrap()
          .to_string();

        let imports: Vec<&str> = comment_string.split("\n").collect();

        for import in imports {
          let mut import_string = import.to_string();

          if import_string.contains("import") {
            remove_whitespace(&mut import_string);

            import_string = import_string
              .strip_prefix("import")
              .unwrap()
              .to_string()
              .replace("'", "");

            import_string = format!("{}/{}", component_base_path, import_string);

            let imported_component_path = Path::new(&import_string).canonicalize().unwrap();
            let imported_component_path = String::from(imported_component_path.to_str().unwrap());

            imported_components.push(imported_component_path);
          }
        }
      }
      comment.as_node().detach();
    }
  }
}

fn remove_whitespace(s: &mut String) {
  s.retain(|c| !c.is_whitespace());
}
