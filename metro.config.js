const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

const zustandRoot = path.dirname(require.resolve('zustand/package.json'));

const originalResolveRequest = config.resolver?.resolveRequest;

config.resolver = {
    ...config.resolver,
    resolveRequest: (context, moduleName, platform) => {
        if (moduleName === 'zustand' || moduleName.startsWith('zustand/')) {
            const subpath = moduleName.slice('zustand'.length).replace(/^\//, '');
            const cjsFile = subpath
                ? path.join(zustandRoot, subpath + '.js')
                : path.join(zustandRoot, 'index.js');

            try {
                require.resolve(cjsFile);
                return { filePath: cjsFile, type: 'sourceFile' };
            } catch {
                // File doesn't exist, fall through
            }
        }

        if (originalResolveRequest) {
            return originalResolveRequest(context, moduleName, platform);
        }
        return context.resolveRequest(context, moduleName, platform);
    },
};

module.exports = withNativeWind(config, { input: './global.css' });
