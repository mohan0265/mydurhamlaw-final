# Auto-Generated Demos

MyDurhamLaw uses an automated pipeline to generate "step-by-step" demo assets from the real UI. This ensures our public demos always match the current look and feel of the application.

## 🚀 How it Works

1.  **Selectors**: Public demo pages (`/demo/*`) are instrumented with stable `data-demo="..."` attributes.
2.  **Plan**: `scripts/demoCapturePlan.mjs` defines a sequence of actions (click, type, wait) for each demo flow.
3.  **Capture**: `scripts/capture-demos.mjs` launches a headless Chromium browser, navigates to the pages, executes the actions, and saves high-res screenshots to `/public/demos/`.
4.  **Registry**: `src/content/demoVideos.ts` maps these static screeshots to the `DemoPlayer` component.

## 🛠️ Usage

### Run Locally (Development)

Generate assets against your local server:

```bash
npm run demo:capture
```

_Requires `npm run dev` to be running on port 3000._

### Run Against Production

Generate assets against the live site:

```bash
npm run demo:capture:prod
```

## 🧩 Adding a New Demo

1.  **Create/Update Page**: Add `data-demo` attributes to the interactive elements in your `/demo/` page.
    ```tsx
    <button data-demo="my-action-btn" ...>Click Me</button>
    ```
2.  **Update Plan**: Add a new entry to `scripts/demoCapturePlan.mjs`.
    ```js
    {
      id: "my_feature",
      slug: "my-feature",
      path: "/demo/my-feature",
      steps: [
        {
          name: "Click Action",
          actions: [{ type: 'click', selector: '[data-demo="my-action-btn"]' }],
          screenshot: "step-02.png",
          caption: "Shows the action result."
        }
      ]
    }
    ```
3.  **Update Registry**: Add the demo to `src/content/demoVideos.ts`.
    ```ts
    my_feature: {
      id: "my_feature",
      title: "My Feature",
      type: "steps",
      steps: [
        { src: "/demos/my-feature/step-01.png", alt: "Intro", caption: "Intro text" },
        { src: "/demos/my-feature/step-02.png", alt: "Action", caption: "Shows the action result." },
      ]
    }
    ```
