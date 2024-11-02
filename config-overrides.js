module.exports = function override (config, env) {
    let loaders = config.resolve
    loaders.fallback = {
        "crypto": require.resolve("crypto-browserify"),
        "os": require.resolve("os-browserify/browser"),
        "constants": require.resolve("constants-browserify"),
        "stream": require.resolve("stream-browserify"),
        "path": require.resolve("path-browserify"),
        "fs": false,
    }
    return config
}

