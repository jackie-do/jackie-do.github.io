---
title: React - Road to enterprise - Part 1 - A pretty good ReactJS structure
date: "2023-06-01T00:00:00.000Z"
description: "A pretty good ReactJS structure"
tags: ["reactjs"]
---

```toc
# This code block gets replaced with the TOC
```

## Related posts

> 1) Part 1 - A pretty good ReactJS structure
> 2) [Part 2 - API Layer and Managing Async Operations](#)

## Project Structure

```bash
src
|-- api
|-- assets
    |-- fonts
    |-- images
|-- components
    |-- common
        |-- button
            |-- Button.tsx
        |-- form
            |-- TextField.tsx
            |-- FieldLabel.tsx
        |-- text
            |-- Typography.tsx
            |-- Headline.tsx
    |-- transitions
|-- hooks
|-- context
|-- layout
|-- config
|-- constants
|-- helpers
|-- i18n (optional)
|-- services
|-- store
|-- styles
|-- types
|-- views
    |-- products
        |-- components
            |-- productForm
                |-- ProductForm.tsx
                |-- productFormService.ts
                |-- productFormUtils.ts
        |-- helpers
            |-- productUtils.ts
        |-- services
            |-- productService.ts
        |-- ViewProduct
            |-- components
                |-- ProductImage.tsx
                |-- ProductDetails.tsx
            |-- views
                |-- BasicProductDetails.tsx
                |-- AdvancedProductDetails.tsx
            |-- ViewProduct.tsx
        |-- Products.tsx
        |-- AddProduct.tsx
        |-- EditProduct.tsx
        |-- DeleteProduct.tsx
```

### api

First, we have the `api` folder, which will contain the API Layer of our application. It will have methods
that are responsible for performing API requests and communicating with a server.

### assets

The `assets` folder contains `fonts` and `images` . In the `fonts` , you can keep any custom fonts
and typefaces. In `images` store any pictures used throughout the application.

### components

The `common` directory will contain any reusable components that are commonly used throughout the application. For instance, buttons, form components, components related to typography, and so on. Any components that are not as common would be placed inside of `components` but outside of the `common` directory.

### hooks

The `hooks` directory, as the name suggests, would hold any custom and reusable hooks. Note that any
hooks that are not really reusable, but are coupled to a specific feature, should be placed in the same
directory as that feature.

For instance, imagine we have a newsletter form component that contains a form to sign up a user for a newsletter. This component could utilise a hook called `useNewsletterSignup` that would handle signing up a user. A hook like this shouldn’t be placed in the global `src/hooks` directory, but rather locally, as it is coupled to the `NewsletterForm` component. Here’s what it could look like:

```bash
src
|-- hooks
|-- components
    |-- common
        |-- NewsletterForm
            |-- hooks
                |-- useNewsletterSignup.ts
            |-- NewsletterForm.tsx
```

It’s best to keep logic that is coupled as closely as possible to where it is used. This way, we will not
unnecessarily add more code into the global
hooks folder that should contain only reusable hooks.
The same applies to other functionality, such as helpers, services, etc.

### context

The `context` directory should contain any global-level context state providers.

### layout

`layout` directory, as the name suggests, should have components that provide different layouts for your pages. For example, if you are building a dashboard application, you could render different layouts
depending on if a user is logged in or not.

### config

In the `config` directory, you can put any runtime config files for your application and third-party
services. For instance, if you use a service like Firebase or OIDC for authentication, you will need to add
configuration files and use them in your app. Just make sure not to confuse config with environmental
variables, as anything that goes here will be present in the build bundle.

### constants

Here you can put any constant variables that are used throughout the application. It’s a good practice
to capitalise your constants to distinguish them from other variables and localised constants in your app.
Below are some examples of defining and using constants.

> Define constants separately

```js
// in constants/appConstants.ts
export const APP_NAME = 'Super app'
export const WIDGETS_LABEL = 'Widgets'
// Somewhere in your app
import { APP_NAME, WIDGETS_LABEL } from '@/constants/appConstants'
console.log(APP_NAME)
// You can also grab all named exports from the file
import * as APP_CONSTANTS from '@/constants/appConstants'
console.log(APP_CONSTANTS.WIDGETS_LABEL)
```

> Define related constants in one object

```js
// in constants/appConstants.ts
// Create an object with constant values
export const apiStatus = {
  IDLE: 'IDLE',
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR'
}
// Somewhere in your app
import { apiStatus } from '@/constants/appConstants'
console.log(apiStatus.PENDING)
```

### helpers

Any utilities and small reusable functions should go here - for example, functions to format date, time, etc.

### i18n

This directory is optional. Add it if an application requires internalisation support. Intl, also known as
i18n, is about displaying the content of an app in a format appropriate to the user’s locale. This content
can include but not be limited to translated text or specific format of dates, time, and currency. For instance, whilst the UK uses DD/MM/YYYY format, the US uses MM/DD/YYYY.

### services

In larger applications, we might have complex business logic code that is used in a few different places.
A code like this is a good candidate to be extracted from components and placed somewhere else, and the `services` folder is a good candidate for that.

### store

The `store` folder is responsible for files related to global state management. There are many state
management solutions that can be used for React projects, such as Redux, Zustand, Jotai, and many many more.

### styles

You can put global styles, variables, theme styles, and overrides in the `styles` folder.

### types

Here you can put any global and shareable types.

### views

*Usually*, the `views` directory only contains route/page components. For example, if we have a page
that is supposed to allow users to view products, we would have a component `Products.tsx` in the `views` folder, and the corresponding route could be something like this:

```jsx
<Route path="/projects" element={<Products />} />
```

There is a reason why I said “usually”, though. Many applications have route components in the views, and the rest of the components for it are placed in the components folder. This approach can work
for small to medium applications but is much harder to manage and maintain when the number of pages
and components grows.

In the `views` folder example mentioned above, we have a `Products` view. Imagine you are working
on an admin dashboard for an e-commerce app. A user should be able to browse products, select a
product to see more details about it, as well as add, update, and delete it. The question is, how all of
this should be handled? The first thought might be to do it in the same way as we added the `Products`
view.

```jsx
<Route path="/products" element={<Products />} />
<Route path="/product/:id" element={<ViewProduct />} />
<Route path="/add-product" element={<AddProduct />} />
<Route path="/edit-product/:id" element={<EditProduct />} />
<Route path="/delete-product/:id" element={<DeleteProduct />} />
```

Our views directory would now contain:

```bash
views
|-- Products.tsx
|-- ViewProduct.tsx
|-- AddProduct.tsx
|-- EditProduct.tsx
|-- DeleteProduct.tsx
```

Just for the *product* feature, we have five new files. Now imagine we have ten or more features that
require CRUD functionality. We could quickly end up with a massive amount of files, and it would soon
become a pain to manage. Therefore, let’s do it differently ==> Instead of keeping *Product* files at the top of the `views` folder, we will group them by a feature name. Let’s put all the files in the folder called `products` .

```bash
views
|-- products
    |-- Products.tsx
    |-- ViewProduct.tsx
    |-- AddProduct.tsx
    |-- EditProduct.tsx
    |-- DeleteProduct.tsx
```

All files that are related to the `product` feature are now kept together. Thanks to that, finding and
managing route components should be much easier. We can also change routes config to follow a similar
pattern and define product-related routes as children of the `products` path.

```jsx
<Route path="/products">
  <Route index element={<Products />} />
  <Route path="add" element={<AddProduct />} />
  <Route path=":id/edit" element={<EditProduct />} />
  <Route path=":id/delete" element={<DeleteProduct />} />
  <Route path=":id" element={<ViewProduct />} />
</Route>
```

As shown in the example above, we don’t use any component for the /products path but instead nest
all the product routes. Here is an example of which component would be rendered for provided URLs:

```bash
• /products - <Products />
• /products/add - <AddProduct />
• /products/1/edit - <EditProduct />
• /products/1/delete - <DeleteProduct />
• /products/1 - <ViewProduct />
```

Here is an example of how Link components could look like for each path.

```jsx
<Link to="/products">Browse Products</Link>
<Link to="/products/2">View Product</Link>
<Link to="/products/add">Add Product</Link>
<Link to="/products/2/edit">Edit Product</Link>
<Link to="/products/2/delete">Delete Product</Link>

// Dynamic link
<Link to={`/products/${product.id}/edit`}>Edit Product</Link>
```
