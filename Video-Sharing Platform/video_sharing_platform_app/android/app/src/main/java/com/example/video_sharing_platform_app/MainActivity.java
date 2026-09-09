package com.example.video_sharing_platform_app;

import android.os.Bundle;
import android.view.SurfaceView;
import android.view.ViewGroup;

import io.flutter.embedding.android.FlutterActivity;
import io.flutter.plugin.common.MethodCall;
import io.flutter.plugin.common.MethodChannel;
import com.pedro.rtmp.utils.ConnectCheckerRtmp;
import com.pedro.rtplibrary.rtmp.RtmpCamera2;

public class MainActivity extends FlutterActivity {
	private static final String CHANNEL = "video_platform/rtmp";
	private RtmpCamera2 rtmpCamera;
	private MethodChannel methodChannel;

	@Override
	protected void onCreate(Bundle savedInstanceState) {
		super.onCreate(savedInstanceState);

		SurfaceView surfaceView = new SurfaceView(this);
		surfaceView.setLayoutParams(new ViewGroup.LayoutParams(1, 1));
		addContentView(surfaceView, surfaceView.getLayoutParams());

		rtmpCamera = new RtmpCamera2(surfaceView, new ConnectCheckerRtmp() {
			@Override public void onConnectionStartedRtmp(String url) { send("connecting", url); }
			@Override public void onConnectionSuccessRtmp() { send("connected", null); }
			@Override public void onConnectionFailedRtmp(String reason) { send("error", reason); }
			@Override public void onNewBitrateRtmp(long bitrate) { send("bitrate", bitrate); }
			@Override public void onDisconnectRtmp() { send("disconnected", null); }
			@Override public void onAuthErrorRtmp() { send("authError", null); }
			@Override public void onAuthSuccessRtmp() { send("authSuccess", null); }
		});

		methodChannel = new MethodChannel(
				getFlutterEngine().getDartExecutor().getBinaryMessenger(), CHANNEL);
		methodChannel.setMethodCallHandler(this::handleMethodCall);
	}

	private void handleMethodCall(MethodCall call, MethodChannel.Result result) {
		if ("start".equals(call.method)) {
			String url = call.argument("url");
			if (url == null || url.isEmpty()) {
				result.error("INVALID_URL", "RTMP URL is required", null);
				return;
			}
			try {
				boolean prepared = rtmpCamera.prepareVideo(1280, 720, 30, 1_200_000, 0)
						&& rtmpCamera.prepareAudio();
				if (!prepared) {
					result.error("PREPARE_FAILED", "Camera or microphone could not be prepared", null);
					return;
				}
				rtmpCamera.startStream(url);
				result.success(true);
			} catch (Exception error) {
				result.error("START_FAILED", error.getMessage(), null);
			}
		} else if ("stop".equals(call.method)) {
			if (rtmpCamera != null && rtmpCamera.isStreaming()) rtmpCamera.stopStream();
			result.success(true);
		} else {
			result.notImplemented();
		}
	}

	private void send(String event, Object value) {
		if (methodChannel != null) {
			runOnUiThread(() -> methodChannel.invokeMethod(event, value));
		}
	}

	@Override
	protected void onDestroy() {
		if (rtmpCamera != null && rtmpCamera.isStreaming()) rtmpCamera.stopStream();
		super.onDestroy();
	}
}
