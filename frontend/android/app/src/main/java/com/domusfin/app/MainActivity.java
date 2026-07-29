package com.domusfin.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // registerPlugin(com.getcapacitor.community.webintent.WebIntent.class);
        registerPlugin(com.domusfin.app.AndroidSettingsPlugin.class);
    }
}
