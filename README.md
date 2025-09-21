# Force-Content-Previewer
A Firefox add-on that prevents forced file downloads on specified domains and attempts to preview the content directly in your browser.

# Why You Need This
Are you tired of websites automatically downloading files when you just want a quick look? This extension is for you. It's especially useful for:
- **University LMS (Learning Management Systems)**: Instantly view lecture notes, assignments, and syllabi without cluttering your downloads folder.

# Features
- **Prevents Forced Downloads**: Works by rewriting the `Content-Disposition: attachment` header to `inline`.
- **Disables download Attribute**: Overrides the `download` attribute on `<a>` tags to prioritize previewing.
- **Privacy-Focused**: The extension does nothing by default. It only activates on domains you explicitly approve in the options page.

# How to Use

[![Image from Gyazo](https://i.gyazo.com/6052f89ebdea8b6e5e17d3292cbb31e7.png)](https://gyazo.com/6052f89ebdea8b6e5e17d3292cbb31e7)

1. Navigate to [**`about:addons`**](about:addons) in Firefox, or find "Add-ons and Themes" in the menu.
2. Find **Force Content Previewer** in your list of extensions and click on it.
3. Go to the **"Preferences" (設定)** tab to open the settings page.
4. In the **"Add a new permission" (新しいドメインの権限を追加)** section, enter the URL match pattern for the website you want to enable. (See examples below).
5. Click the **"Add" (追加)** button and grant the permission when prompted.
6. Once the domain appears in the **"Permitted Domains" (許可されたドメイン)** list, you're all set!



## Understanding URL Match Patterns
Here are some common examples to help you get started:
- **A specific university LMS**:\
    `*://lms.example.com/*`\
    This pattern targets only your university's LMS site.
- **All subdomains of a specific site:**\
    `*://*.example.com/*`\
    This will work on `example.com`, `portal.example.com`, etc. The `*` before `example.com` is a wildcard for all subdomains.

The pattern consists of `scheme://host/path`. The `*` acts as a wildcard. Using `*` for the scheme matches both `http` and `https`.

# Installation
## From GitHub Releases (Manual Install)
1. Go to the [**Releases page**](releases/).
2. Download the latest `.xpi` file.
3. In Firefox, navigate to [`about:addons`](about:addons).
4. Drag and drop the downloaded `.xpi` file onto the page to install it.

# Permissions Explained
This add-on requests the minimum permissions necessary to function:
- **`storage`**: Used to save your list of permitted domains.
- **`declarativeNetRequest`**: The core feature. Used to rewrite web server response headers to change downloads into previews.
- **`scripting`**: Used to remove the `download` attribute from links on pages you have approved.
- **`webRequest`**: Used to detect when a page has finished loading to know when to run a script.
- **`optional_host_permissions`**: Used to **request your permission at runtime** for the sites you add. The add-on has no access to any websites when you first install it.
