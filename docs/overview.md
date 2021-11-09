## Documentation

The syntax and functionality of PoppyHTML is intentionally small and concise. 

It operates within the confines of standard HTML syntax and simply seeks to enable some of the hallmarks of modern frontend frameworks, such as: 

- A familiar component format
- Basic data passing via component props
- An intuitive templating syntax
- Very basic component-scoped CSS and JavaScript
- A few more things

PoppyHTML is best used for building small (mostly) static websites. You won't find any fancy diffing algorithms, virtual doms, reactive data, stateful components, or declarative syntax here. It's just plain vanilla HTML, CSS, and JavaScript that can be organized and structured in a way that is far more composable and easy to reason about.

Below is a quick overview of some of the major parts of PoppyHTML, along with a list of future goals towards the bottom.

### Component Format

The PoppyHTML component format takes heavy inspiration from that of [Svelte](https://svelte.dev/), [Vue](https://vuejs.org/), and [HTMLx](https://github.com/htmlx-org/HTMLx) syntax.

Components are written in plain old `.html` files and have a basic structure that looks like the following:

```html
<script>
  // optional component logic goes here
</script>

<!-- component markup goes here -->

<style>
  /* optional component styles go here */
</style>
```

To use a component in another `.html` file, you simple add a multiline comment at the top of the file that looks like the following:

```html
<!-- 
  import './path/to/mycomponent.html'
 -->

<mycomponent />
```

Some important things to note about this are that: 

- The file name (i.e. `mycomponent.html`) and component (i.e `<mycomponent />`) must be the same
- Component names must be lowercase to match the syntax standards of vanilla HTML
- Components must take the form of self closing HTML tags (i.e. `<mycomponent></mycomponent>` is not valid)
- While a single word component is demonstrated above, component names with dashes, such as `<my-component />`, are also valid

### Component Props and Template Syntax

Very rudimentary data passing and templating syntax is also possible in PoppyHTML.

Props take the exact same form as HTML attributes––the difference is simply in semantics, components have props, while HTML elements have attributes.

Inside your component, a prop is implicitly created by wrapping the desired prop name in curly braces and placing it directly in your markup.

```html
<h1>Hello {name}!</h1>
```

When the component is then used in another file, add the prop name and desired value to your component markup (again following the same syntax as standard HTML attributes).

```html
<!-- 
  import './hello.html'
 -->

<hello name="Universe" />
```

The resulting compiled HTML will look like: `<h1>Hello Universe!</h1>`.

### Component Logic and Styling

Components can also contain logic and styling defined inside `script` and `style` tags respectively.

At this time, logic and styling are NOT scoped to the component, meaning everything lives in the global scope and you are responsible for avoiding namespace clashes across all components and files. In the future the goal is to scope these details to each component instance.

Another notable aspect of component logic and styling is that they must be written in vanilla JavaScript and CSS to follow conventions of vanilla HTML syntax.

Below is a simple counter component example that demonstrates component logic and styling.

```html
<script>
  window.addEventListener('load', () => {
    const button = document.querySelector('button');
    button.addEventListener('click', incremementCount);
  });

  function incremementCount() {
    const countSpan = document.getElementById('count');
    let count = parseInt(countSpan.textContent);
    countSpan.textContent = count + 1;
  }
</script>

<button>Clicked <span id="count">0</span> times</button>

<style>
  button {
    font-family: inherit;
    font-size: 16px;
    border: none;
    border-radius: 50px;
    color: white;
    background-color: rgb(67, 42, 230);
    padding: 0.75rem 1rem;
    margin: 1rem;
  }

  button:hover {
    cursor: pointer;
    background-color: rgb(53, 32, 187);
  }
</style>
```

Again, it worth noting that currently logic and styles are compiled and built into JavaScript and CSS files that live in the global scope. 

This means you are responsible for things such as wrapping JS code in an event listener that waits for the DOM to load before running component logic. It also means that while the above button styling works for this component, any `<button>` element in other files will pick up this styling.

Eventually this will change, but for now it's your responsibility to keep track of these details.

### Future Functionality, Syntax, and Tooling

Below is a list of future functionality and syntax that are being considered for PoppyHTML.

- Nested component children using the `<slot />` element
- Multiple nested component children using named slots
- Component scoped CSS / JS
- Multipage website compilation (potentially using a `routes` page directory structure?)
- Improve output code quality
- New project creation using `npm init poppyhtml` command
- Rebuild the compiler and CLI using the Rust programming language
- Ship built-in dev server/file watcher?
- Ship built-in code formatter?
- Ship built-in code linter?