; Custom NSIS installer script for SkllPlayer
; Desktop shortcut is handled by electron-builder (createDesktopShortcut: true)

!include "LogicLib.nsh"

; Custom uninstall - remove shortcuts and optionally app data
!macro customUnInstall
    ; Remove desktop shortcut
    Delete "$DESKTOP\${PRODUCT_NAME}.lnk"

    ; Ask user if they want to delete app data
    MessageBox MB_YESNO|MB_ICONQUESTION "Deseja remover todos os dados do aplicativo?$\n$\n(configurações, biblioteca, cache, etc.)" IDNO +4
    ; User clicked Yes - delete app data
    RMDir /r "$APPDATA\skllplayer"
    RMDir /r "$LOCALAPPDATA\skllplayer"
    RMDir /r "$LOCALAPPDATA\${PRODUCT_NAME}"
!macroend
