// Windows'ta release'de ekstra konsol penceresi açılmasın (macOS'ta etkisiz, standart bırakıldı).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    autoreji_lib::run()
}
