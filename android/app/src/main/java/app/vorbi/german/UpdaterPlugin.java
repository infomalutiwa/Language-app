package app.vorbi.german;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Locale;

/**
 * Downloads a release APK from this project's GitHub releases and starts Android's package installer.
 * The URL must be one of this repository's release assets, the SHA-256 is mandatory and checked, the file must
 * look like an APK, and Android's installer still enforces that it is signed with this app's key.
 */
@CapacitorPlugin(name = "Updater")
public class UpdaterPlugin extends Plugin {

    private static final String ALLOWED_PREFIX = "https://github.com/infomalutiwa/Language-app/releases/download/";
    private static final long MAX_BYTES = 150L * 1024 * 1024;

    private File updateDir() {
        File dir = new File(getContext().getCacheDir(), "updates");
        if (!dir.exists()) dir.mkdirs();
        return dir;
    }

    @PluginMethod
    public void getVersion(PluginCall call) {
        try {
            PackageInfo pi = getContext().getPackageManager().getPackageInfo(getContext().getPackageName(), 0);
            JSObject r = new JSObject();
            r.put("versionName", pi.versionName);
            r.put("versionCode", Build.VERSION.SDK_INT >= 28 ? pi.getLongVersionCode() : pi.versionCode);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("version unavailable", e);
        }
    }

    @PluginMethod
    public void download(final PluginCall call) {
        final String url = call.getString("url");
        final String expected = call.getString("sha256");
        if (url == null || !url.startsWith(ALLOWED_PREFIX)) {
            call.reject("only this repository's GitHub release assets are allowed");
            return;
        }
        if (expected == null || !expected.matches("(?i)[0-9a-f]{64}")) {
            call.reject("a SHA-256 checksum is required");
            return;
        }
        new Thread(() -> {
            HttpURLConnection conn = null;
            File out = new File(updateDir(), "Vorbi-update.apk");
            boolean ok = false;
            try {
                conn = (HttpURLConnection) new URL(url).openConnection();
                conn.setInstanceFollowRedirects(true);
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(30000);
                if (conn.getResponseCode() != 200) {
                    call.reject("download failed: HTTP " + conn.getResponseCode());
                    return;
                }
                long total = conn.getContentLengthLong();
                if (total > MAX_BYTES) {
                    call.reject("update file too large");
                    return;
                }
                MessageDigest md = MessageDigest.getInstance("SHA-256");
                try (InputStream in = conn.getInputStream(); OutputStream os = new FileOutputStream(out)) {
                    byte[] buf = new byte[32768];
                    long done = 0;
                    int lastPct = -1;
                    int n;
                    while ((n = in.read(buf)) > 0) {
                        os.write(buf, 0, n);
                        md.update(buf, 0, n);
                        done += n;
                        if (done > MAX_BYTES) throw new java.io.IOException("update file too large");
                        if (total > 0) {
                            int pct = (int) (done * 100 / total);
                            if (pct != lastPct) {
                                lastPct = pct;
                                JSObject p = new JSObject();
                                p.put("percent", pct);
                                notifyListeners("progress", p);
                            }
                        }
                    }
                }
                StringBuilder hex = new StringBuilder();
                for (byte b : md.digest()) hex.append(String.format(Locale.ROOT, "%02x", b));
                if (!expected.equalsIgnoreCase(hex.toString())) {
                    call.reject("checksum mismatch");
                    return;
                }
                if (!looksLikeApk(out)) {
                    call.reject("not an APK file");
                    return;
                }
                ok = true;
                JSObject r = new JSObject();
                r.put("path", out.getAbsolutePath());
                call.resolve(r);
            } catch (Exception e) {
                call.reject("download failed", e);
            } finally {
                if (conn != null) conn.disconnect();
                if (!ok) out.delete();
            }
        }).start();
    }

    private static boolean looksLikeApk(File f) {
        try (InputStream in = new java.io.FileInputStream(f)) {
            byte[] m = new byte[4];
            return in.read(m) == 4 && m[0] == 'P' && m[1] == 'K' && m[2] == 3 && m[3] == 4;
        } catch (Exception e) {
            return false;
        }
    }

    @PluginMethod
    public void install(PluginCall call) {
        try {
            File apk = new File(call.getString("path", ""));
            if (!apk.getCanonicalPath().startsWith(updateDir().getCanonicalPath() + File.separator) || !apk.isFile()) {
                call.reject("unknown update file");
                return;
            }
            JSObject r = new JSObject();
            if (!getContext().getPackageManager().canRequestPackageInstalls()) {
                // Android asks once per app: allow installs from this app.
                Intent s = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + getContext().getPackageName()));
                s.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(s);
                r.put("started", false);
                r.put("needsPermission", true);
                call.resolve(r);
                return;
            }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", apk);
            Intent i = new Intent(Intent.ACTION_VIEW);
            i.setDataAndType(uri, "application/vnd.android.package-archive");
            i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
            r.put("started", true);
            call.resolve(r);
        } catch (Exception e) {
            call.reject("install failed", e);
        }
    }
}
