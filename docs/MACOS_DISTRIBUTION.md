# macOS Distribution

The macOS desktop build is produced by `electron-builder` and lives under
`release/` after a build. The Vite production bundle goes to `dist/`.

## Build targets

| npm script | What it does | Output |
|---|---|---|
| `npm run dist:mac` | Build + sign (if a Developer ID cert is in the keychain) | `release/*.dmg`, `release/*-mac.zip` (arm64 + x64) |
| `npm run dist:mac:unsigned` | Build with signing forcibly disabled (ad-hoc only) | unsigned `.app` inside `release/mac-*/` plus `.dmg` and `.zip` |
| `npm run dist:mac:notarize` | Build + sign + submit to Apple notary | notarized + stapled `.app`, `.dmg`, `.zip` |
| `npm run dist:mac:arm64` | Apple Silicon only | smaller artifact, half the build time |
| `npm run dist:mac:x64` | Intel only | x64 artifact only |

Every signed/notarized build also requires Apple's hardened-runtime, which is
already enabled in `package.json` (`"hardenedRuntime": true`) along with the
entitlements in `build/entitlements.mac.plist`.

## Signing tiers

| Cert type | Build runs on the dev's Mac? | Passes Gatekeeper on *other* Macs? | Apple Developer Program required? |
|---|---|---|---|
| None (ad-hoc) | Yes, after first-launch right-click → Open or `xattr -d com.apple.quarantine` | No | No |
| Apple Development | Same as ad-hoc (Apple Development certs cannot sign distributable runtimes; `errSecInternalComponent`) | No | $99/yr |
| **Developer ID Application + notarization** | Yes, like any other app | **Yes** | $99/yr |

For sharing the app with anyone outside your own machine you want the third
tier. The other two are equivalent in practice — they only work on machines
that have already trusted the binary.

## Obtaining a Developer ID Application certificate

1. Open <https://developer.apple.com/account/resources/certificates/list>.
2. Click **+** → **Software** → **Developer ID Application** → Continue.
3. Generate a Certificate Signing Request from Keychain Access
   (*Keychain Access → Certificate Assistant → Request a Certificate From a
   Certificate Authority*; save to disk).
4. Upload the CSR, download the resulting `developerID_application.cer`,
   double-click to import into the login keychain.
5. Verify with:
   ```bash
   security find-identity -v -p codesigning | grep "Developer ID Application"
   ```

## Setting up notarization (one-time)

1. Sign in at <https://appleid.apple.com/account/manage>.
2. Under **Sign-In and Security → App-Specific Passwords**, create one labeled
   e.g. *electron-builder*. Save the 16-character password.
3. Find your Team ID at
   <https://developer.apple.com/account#MembershipDetailsCard>
   (10-char alphanumeric, e.g. `ABCDE12345`).

## Running a fully-signed + notarized build

```bash
export APPLE_ID="you@example.com"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="ABCDE12345"

npm run dist:mac:notarize
```

The build will:

1. Compile the Vite bundle → `dist/`.
2. Bundle Electron + your code → `release/mac-arm64/Photo Guessing Game.app`
   (and `release/mac/Photo Guessing Game.app` for Intel).
3. Sign every framework / dylib / executable with the Developer ID cert.
4. Submit each `.zip` to Apple's notary service (`xcrun notarytool submit`).
5. Wait for Apple to return a verdict (typically <5 minutes).
6. Staple the notarization ticket onto the `.app` so it works offline.
7. Pack the result into `.dmg` and `.zip` artifacts.

Each architecture is notarized independently.

## Verifying a notarized build

```bash
# 1. Codesign claims to be valid:
codesign --verify --deep --strict --verbose=2 "release/mac-arm64/Photo Guessing Game.app"

# 2. The notarization ticket is stapled:
xcrun stapler validate "release/mac-arm64/Photo Guessing Game.app"

# 3. Gatekeeper would let the app run:
spctl --assess --type execute --verbose "release/mac-arm64/Photo Guessing Game.app"
```

A clean run prints `accepted` for each step.

## Storing the credentials (recommended)

Store the app-specific password and Team ID in your password manager. If using
1Password CLI, reference them in a `.env` generated from a `.env.tpl`:

```
# .env.tpl
APPLE_ID=op://<vault>/apple-notarization/username
APPLE_APP_SPECIFIC_PASSWORD=op://<vault>/apple-notarization/password
APPLE_TEAM_ID=op://<vault>/apple-notarization/team-id
```

Then:

```bash
op inject -i .env.tpl -o .env
source .env
npm run dist:mac:notarize
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `errSecInternalComponent` on codesign | Apple Development cert being used as a distribution cert | Obtain a Developer ID Application cert, or run `npm run dist:mac:unsigned` |
| `notarytool: Invalid credentials` | App-specific password expired or wrong Apple ID | Regenerate the app-specific password |
| `notarytool: Invalid Team ID` | Team ID typo, or the cert isn't tied to that team | Re-check at developer.apple.com |
| Notarization rejected with "The signature does not include a secure timestamp" | `--timestamp` missing during codesign | electron-builder includes it by default; ensure no custom `afterSign` hook strips it |
| Gatekeeper says "damaged" on another Mac | Build is ad-hoc only (unsigned) | Use the notarized build, or have the user run `xattr -dr com.apple.quarantine /Applications/Photo\ Guessing\ Game.app` |
