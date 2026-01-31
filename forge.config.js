module.exports = {
  packagerConfig: {
    name: 'Copilot Ralph',
    executableName: 'copilot_ralph',
    icon: './build/icon',
    appBundleId: 'com.example.copilot-ralph',
    osxSign: {},
    osxNotarize: process.env.APPLE_ID
      ? {
          appleId: process.env.APPLE_ID,
          appleIdPassword: process.env.APPLE_PASSWORD,
          teamId: process.env.APPLE_TEAM_ID
        }
      : undefined
  },
  makers: [
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin']
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        icon: './build/icon.icns',
        format: 'ULFO'
      }
    }
  ]
}
