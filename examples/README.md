# Examples

This is examples folder. These examples are used to test new features and as sample showcases.

___
### Contributing guidelines

If you want to contribute to the example collection, I ask you to follow few guidelines. These are valid if you are creating a new sub-package.

- Create a new folder and run `npm --init -y` then patch its rules with the these. These are the only things I ask you to not touch (typescript version excluded).

```json
{
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "build": "npx tsc"
  },
  "author": "Alexander P. Cerutti <cerutti.alexander@gmail.com>",
  "license": "ISC",
  "devDependencies": {
    "typescript": "^3.9.2"
  }
}
```

- Add yourself as contributor in `package.json` (refer to [NPM official documentation](https://docs.npmjs.com/files/package.json#people-fields-author-contributors) )
- Give it a meaningful name according to what you want to sample;
- Write the examples in Typescript (if you can't, you'll be helped to convert it in the Pull Request);
- When opening a Pull Request, ensure to have the checkbox `Allow Edits from Maintainers` checked so changed can be applied before merging.
- Enjoy writing the example and thank you very much.

___

Every contribution is really appreciated. ❤️ Thank you!
