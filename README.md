# Cloud URL Shortener Client

This simple front-end was created using the Vite + TypeScript + SWC template.

## Configure & Run

This repository contains a `.env` file with the envvar `VITE_API_ENDPOINT` which defines the URL Shortener API endpoint the application will `fetch` from, and must be configured before running the app.

For example, to make `https://1234567890.execute-api.us-east-1.amazonaws.com/prod/` the API endpoint, there are 2 ways:

- _(Recommended)_ Set the envvar in the running environment, this will override any envvars defined in a `.env` file. For example, passing envvar to an ECS container:

  ```json
  {
    "containerDefinitions": [
      {
        "environment": [
          {
            "VITE_API_ENDPOINT": "https://1234567890.execute-api.us-east-1.amazonaws.com/prod/"
          }
        ]
      }
    ]
  }
  ```

- Edit the envvar in `.env`

  ```ini
  VITE_API_ENDPOINT="https://1234567890.execute-api.us-east-1.amazonaws.com/prod/"
  ```

After that, run the application with:

```sh
npm run dev
```

Alternatively, bundle (build) the application with `npm run build`, then serve the files inside the `dist/` directory using an HTTP server.
