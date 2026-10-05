package com.chordipot.app;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.ConsoleMessage;
import android.util.Log;

public class MainActivity extends Activity {

    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);

        WebSettings settings = webView.getSettings();

        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);

        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);

        settings.setLoadWithOverviewMode(false);
        settings.setUseWideViewPort(false);

        // JavaScript console + dialog support is configured above.

        // Keep navigation inside the WebView
        webView.setWebViewClient(new WebViewClient() {

            @Override
            public void onPageFinished(
                WebView view,
                String url
            ) {
                super.onPageFinished(view, url);

                view.evaluateJavascript(
                    "(function(){"
                    + "var b=document.body;"
                    + "var s=getComputedStyle(b);"
                    + "console.log('CHORDIPOT_DEBUG_BODY_BG=' + s.backgroundColor);"
                    + "console.log('CHORDIPOT_DEBUG_BODY_COLOR=' + s.color);"
                    + "console.log('CHORDIPOT_DEBUG_STYLES=' + document.styleSheets.length);"
                    + "console.log('CHORDIPOT_DEBUG_TITLE=' + document.title);"
                    + "})()",
                    null
                );

                Log.d(
                    "CHORDIPOT_WEBVIEW",
                    "PAGE_FINISHED: " + url
                );
            }
        });

        webView.setWebChromeClient(
            new WebChromeClient() {

                @Override
                public boolean onConsoleMessage(
                    ConsoleMessage message
                ) {
                    Log.d(
                        "CHORDIPOT_WEBVIEW",
                        message.message()
                        + " | line "
                        + message.lineNumber()
                        + " | "
                        + message.sourceId()
                    );

                    return true;
                }
            }
        );

        webView.loadUrl("file:///android_asset/index.html");

        setContentView(webView);
    }

    private static final long DOUBLE_BACK_INTERVAL = 2000;
    private long lastBackPressed = 0;

    private void handleSystemBack() {

        if (webView == null) {
            return;
        }

        webView.evaluateJavascript(
            "window.handleAndroidBack ? window.handleAndroidBack() : false;",
            value -> {

                if ("true".equals(value)) {
                    // Song Viewer handled Back internally.
                    return;
                }

                long now =
                    System.currentTimeMillis();

                if (
                    now - lastBackPressed
                    < DOUBLE_BACK_INTERVAL
                ) {
                    lastBackPressed = 0;
                    MainActivity.super.onBackPressed();
                } else {

                    lastBackPressed = now;

                    android.widget.Toast.makeText(
                        MainActivity.this,
                        "Press Back again to exit",
                        android.widget.Toast.LENGTH_SHORT
                    ).show();
                }
            }
        );
    }

    @Override
    public void onBackPressed() {
        handleSystemBack();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.destroy();
        }

        super.onDestroy();
    }
}
