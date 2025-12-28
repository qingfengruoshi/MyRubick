// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require('path');

module.exports = {
  // transpileDependencies: ["fix-path"],
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.join(__dirname, './src'),
      },
    },
    externals: {
      'dns': 'commonjs dns',
      'http2': 'commonjs http2',
      'original-fs': 'commonjs original-fs',
    },
  },
  pages: {
    index: {
      entry: 'src/renderer/main.ts',
    },
  },
  productionSourceMap: false,
  pluginOptions: {
    electronBuilder: {
      nodeIntegration: true,
      mainProcessFile: 'src/main/index.ts',
      mainProcessWatch: ['src/main'],
      externals: [
        'pouchdb',
        'npm',
        'electron-screenshots',
        '@electron/remote',
        'dns',
        'http2',
        'original-fs',
      ],
      // Use this to change the entry point of your app's render process. default src/[main|index].[js|ts]
      builderOptions: {
        productName: 'rubick',
        appId: 'com.muwoo.rubick',
        copyright: 'Copyright © 2021',

        // ========== 打包优化配置 ==========
        compression: 'normal',  // 启用压缩（可节省 5-10 MB）
        asar: true,             // 启用 asar 打包
        asarUnpack: ['**/*.node'],  // 不压缩原生模块

        // 只保留中英文语言包（可节省 10-15 MB）
        // electronLanguages: ['zh-CN', 'en-US'],

        // 排除不需要的文件（可节省 2-5 MB）
        // 注意：files 配置可能导致入口文件被排除，暂时禁用
        // 使用默认配置，electron-builder 会自动处理
        // files: [
        //   "dist/**/*",
        //   "!**/node_modules/*/{CHANGELOG.md,README.md,readme.md,readme}",
        //   "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
        //   "!**/node_modules/*.d.ts",
        //   "!**/node_modules/.bin",
        //   "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
        //   "!.editorconfig",
        //   "!**/._*",
        //   "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}",
        //   "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
        //   "!**/{appveyor.yml,.travis.yml,circle.yml}",
        //   "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}"
        // ],
        // ========== 优化配置结束 ==========
        // 注意：electronLanguages 选项需要 electron-builder 25+ 才支持
        // 当前版本 22.x 不支持此选项

        extraResources: [
          {
            from: './src/main/browsers/',
            to: './browsers/',
          },
        ],
        // afterPack: './release.js',
        // afterAllArtifactBuild: () => {
        //   return ['./build/app.asar.gz'];
        // },
        directories: {
          output: 'build',
        },
        releaseInfo: {
          releaseName: 'normal', // normal 弹窗 / major 强制更新
          releaseNotesFile: './release/releaseNotes.md',
        },
        publish: [
          {
            provider: 'github',
            owner: 'rubickCenter',
            repo: 'rubick',
          },
        ],
        // files: ["dist_electron/**/*"],
        dmg: {
          contents: [
            {
              x: 410,
              y: 150,
              type: 'link',
              path: '/Applications',
            },
            {
              x: 130,
              y: 150,
              type: 'file',
            },
          ],
        },
        mac: {
          icon: 'public/icons/icon.icns',
          target: [
            {
              target: 'dmg',
              arch: ['x64', 'arm64'],
            },
          ],
          artifactName: 'rubick-${version}-${arch}.dmg',
          gatekeeperAssess: false,
          entitlementsInherit: './release/entitlements.mac.plist',
          entitlements: './release/entitlements.mac.plist',
          hardenedRuntime: true,
          category: 'public.app-category.developer-tools',
          extendInfo: {
            LSUIElement: 1,
          },
        },
        win: {
          icon: 'public/icons/icon.ico',
          artifactName: 'rubick-Setup-${version}-${arch}.exe',
          target: [
            {
              target: 'nsis',
              arch: ['x64', 'ia32'],
            },
          ],
        },
        nsis: {
          shortcutName: 'rubick',
          oneClick: false,
          allowToChangeInstallationDirectory: true,
          include: 'public/installer.nsh',
        },
        linux: {
          icon: 'public/icons/',
          publish: ['github'],
          target: 'deb',
        },
      },
    },
  },
};
