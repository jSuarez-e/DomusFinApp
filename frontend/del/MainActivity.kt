package com.domusfin.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        registerPlugin(AndroidSettingsPlugin::class.java)
        super.onCreate(savedInstanceState)
    }
}
