# Game Assets

This folder contains all 3D models and assets for the Temple Runner game.

## Asset Specifications

### Characters
- **Dimensions**: 1x2x0.5 units (width x height x depth)
- **Format**: GLB
- **Animations**: Idle, Running, Jumping (if supported)

#### Character Files:
- `shadow_character.glb` - Dark silhouette character (locked state)
- `character_red.glb` - Red colored human character (NFT unlock)
- `character_blue.glb` - Blue colored human character (NFT unlock)
- `character_green.glb` - Green colored human character (NFT unlock)

### Environment Assets
- **Format**: GLB
- **Scale**: Optimized for 3D scene (recommend 2.5x scale multiplier)

#### Environment Files:
- `tree.glb` - Background decoration tree (3-4 units tall)
- `rock_large.glb` - Large obstacle rock (1.5x1.5x1.5 units)
- `rock_small.glb` - Small obstacle rock (1x1x1 units)
- `crate.glb` - Wooden crate obstacle (1x1x1 units)

### Collectibles
- **Format**: GLB
- **Dimensions**: 0.6x0.6x0.2 units for coins, 0.8x0.8x0.8 for gems

#### Collectible Files:
- `coin.glb` - Gold coin collectible
- `gem.glb` - Special gem collectible

## Usage Notes
1. All assets should be optimized for mobile performance
2. Textures should be compressed and under 512x512 resolution
3. Polygon count should be kept under 1000 triangles per asset
4. Assets will be scaled automatically in the game (2.5x multiplier)