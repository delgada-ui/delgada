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

pub fn get_node_text(node: NodeRef) -> String {
  let node_text = node.as_text().expect(
    "NEEDS PROPER ERROR HANDLING: `get_node_text` failed to get node text from given node.",
  );
  String::from(node_text.borrow().as_str())
}
