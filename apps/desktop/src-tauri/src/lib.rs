#[cfg(target_os = "linux")]
fn configure_linux_graphics_workarounds() {
    // On some Linux/NVIDIA systems, GBM buffer allocation fails for WebKitGTK.
    // Disabling dmabuf renderer avoids a startup crash in packaged apps.
    if std::env::var_os("WEBKIT_DISABLE_DMABUF_RENDERER").is_none() {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }

    // Prefer a safer compositing path for older/quirky EGL driver setups.
    if std::env::var_os("WEBKIT_FORCE_COMPOSITING_MODE").is_none() {
        std::env::set_var("WEBKIT_FORCE_COMPOSITING_MODE", "1");
    }

    // Keep hardware GL enabled by default unless user explicitly overrides.
    if std::env::var_os("LIBGL_ALWAYS_SOFTWARE").is_none() {
        std::env::set_var("LIBGL_ALWAYS_SOFTWARE", "0");
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    configure_linux_graphics_workarounds();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}