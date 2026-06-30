// AutoReji — Tauri 2 çekirdek. Köprü mantığı web tarafında (lib/native.ts, lib/setup.ts) JS pluginleriyle
// yürür (dialog/fs/opener/shell + Command.sidecar). Rust katmanı ince: pluginleri kaydeder, pencereyi açar.
// Mobil-hazır run() pattern (Tauri 2 standardı).

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("AutoReji başlatılırken hata");
}
