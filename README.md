# Introduction

This project includes diflexmo design system components and can be used as a template for UI project.

# Dependencies:

- Angular 14.0.0
- Storybook 6.5.14
- diflexmo-angular-design 14.20240119.1-rc

## diflexmo-angular-design

To install diflexmo-angular-design library you need to configure the feed: [instruction](https://dev.azure.com/diflexmo/Diflexmo%20Shared/_artifacts/feed/Diflexmo_Shared/connect/npm). The following repository is configured to have the specified feed and you can take a look at .npmrc file as an example.

## Storybook

Storybook is a tool which is used to create components documentation. Each component of design system has its own story, which describes component's arguments and types. Also, a story has an example of how a developer can use a component in code.

## ESLint & Prettier

The current project uses ESLint and Prettier packages in order to format code based on the selected rules. Husky pre-commit hook checks all staged files to follow linter rules, fix auto-fixable issues and notifies user if there is something which should be checked manually.

# Build and Run

- To install all dependencies run `npm install`
- To start the application run `npm start` and it will be available at http://localhost:4200
- To start the storybook run `npm run storybook` and it will be available at http://localhost:6006/
- To run linter for staged files run `npx lint-staged`

# Important moments

## Theming

All color css variables should be defined seperatly in `src/styles/themes` folder in a theme specific file (for now the content of dark theme and light theme is the same).
