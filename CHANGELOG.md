# Changelog

All notable changes to Tiler Quote App will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-01-15

### Added
- Initial release of Tiler Quote App
- Multi-room measurement system with floor and wall support
- Smart material calculations (adhesive, grout, cement board)
- FreeAgent accounting integration via OAuth
- WhatsApp and Email quote export
- Voice input for hands-free measurements
- Rate presets for different pricing scenarios
- Natural stone sealer support
- Levelling compound with depth selection
- Levelling clips with automatic calculation
- Anti-crack membrane support
- Tanking (waterproofing) for walls and floors
- Silicone sealant with perimeter calculation
- Tile trim support with length conversion
- Electric underfloor heating (UFH) with thermostat tracking
- Progressive Web App (PWA) with offline support
- Local storage for quotes and customer details
- Professional quote summary with trader/customer views
- VAT calculation with toggle
- 20% margin on materials
- Modular tile pattern support for mixed tile sizes
- 4-wall auto calculator for wall measurements
- Responsive design for mobile and desktop

### Features
- Save multiple rate presets
- Save and load customer quotes
- Voice recognition for measurements
- Real-time calculations
- Professional quote formatting
- Multiple export options

## [Unreleased]

### Planned
- PDF export with custom branding
- Multiple currency support
- Photo attachment for quotes
- Job management system integration
- Mobile app (React Native)
- Team collaboration features
- Invoice generation from estimates
- Payment integration
- Customer portal
- Recurring estimates/subscriptions

---

## Guidelines for Future Releases

### Semantic Versioning
- MAJOR: Breaking changes or complete rewrites
- MINOR: New features that are backward compatible
- PATCH: Bug fixes and small improvements

### Release Checklist
- [ ] Update version in package.json
- [ ] Update CHANGELOG.md with all changes
- [ ] Update README.md if needed
- [ ] Run full test suite
- [ ] Build production version
- [ ] Create git tag: `git tag v1.0.0`
- [ ] Push tag: `git push origin v1.0.0`
- [ ] Create GitHub Release with changelog
- [ ] Deploy to production
