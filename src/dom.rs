use html5ever::{LocalName, Namespace, QualName};
use kuchiki::NodeRef;
use std::{collections::BTreeMap, str};

pub fn create_and_insert_element(
  html: &NodeRef,
  selector: &str,
  new_element_name: &str,
  new_element_attrs: BTreeMap<&str, &str>,
) {
  let new_node = create_element(new_element_name);
  if let Some(element) = new_node.as_element() {
    let mut element_attrs = element.attributes.borrow_mut();
    for (key, val) in new_element_attrs {
      element_attrs.insert(key, val.into());
    }
  }
  if let Ok(head_elem) = html.select_first(selector) {
    let head_elem_node = head_elem.as_node();
    head_elem_node.append(new_node);
  };
}

fn create_element(name: &str) -> NodeRef {
  NodeRef::new_element(
    QualName::new(
      None,
      Namespace::from("http://www.w3.org/1999/xhtml"),
      LocalName::from(name),
    ),
    BTreeMap::new(),
  )
}

pub fn serialize_node_to_string(node: NodeRef) -> String {
  let mut writer = Vec::new();

  node.serialize(&mut writer).unwrap();
  let node_str = match str::from_utf8(&writer) {
    Ok(node_str) => node_str,
    Err(e) => panic!("Invalid UTF-8 sequence while serializing node: {}", e),
  };

  String::from(node_str)
}
