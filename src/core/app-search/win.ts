import fs from 'fs';
import path from 'path';
import os from 'os';
import { shell } from 'electron';
import { app } from '@electron/remote';
import { execSync } from 'child_process';

const filePath = path.resolve(
  'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs'
);

const appData = path.join(os.homedir(), './AppData/Roaming');

const startMenu = path.join(
  appData,
  'Microsoft\\Windows\\Start Menu\\Programs'
);

const fileLists: any = [];
const isZhRegex = /[\u4e00-\u9fa5]/;

const icondir = path.join(os.tmpdir(), 'ProcessIcon');
const exists = fs.existsSync(icondir);
if (!exists) {
  fs.mkdirSync(icondir);
}

const getico = (appInfo) => {
  const iconpath = path.join(icondir, `${appInfo.name}.png`);
  fs.exists(iconpath, (exists) => {
    if (exists) {
      // console.log('[Icon Debug] icon already exists:', iconpath);
      return;
    }

    // console.log('[Icon Debug] getico start for:', appInfo.name, appInfo.desc);
    app.getFileIcon(appInfo.desc, { size: 'large' }).then(nativeImage => {
      try {
        const buffer = nativeImage.toPNG();
        // console.log('[Icon Debug] icon extracted, buffer length:', buffer ? buffer.length : 'null');
        fs.writeFile(iconpath, buffer, (err) => {
          if (err) {
            // console.error('[Icon Debug] fs.writeFile error:', err);
          } else {
            // console.log('[Icon Debug] icon written successfully:', iconpath);
          }
        });
      } catch (e) {
        // console.error('[Icon Debug] buffer conversion error:', e);
      }
    }).catch(err => {
      // console.error('[Icon Debug] app.getFileIcon error:', err, appInfo.desc);
    });
  });
};

function fileDisplay(filePath) {
  //根据文件路径读取文件，返回文件列表
  fs.readdir(filePath, function (err, files) {
    if (err) {
      console.warn(err);
    } else {
      console.log(`[App Index] Scanning directory: ${filePath}, found ${files.length} items`);
      files.forEach(function (filename) {
        const filedir = path.join(filePath, filename);
        fs.stat(filedir, function (eror, stats) {
          if (eror) {
            console.warn('获取文件stats失败');
          } else {
            const isFile = stats.isFile(); // 是文件
            const isDir = stats.isDirectory(); // 是文件夹
            if (isFile) {
              // Skip desktop.ini and other non-relevant files
              if (filename.toLowerCase() === 'desktop.ini') return;

              const ext = path.extname(filename).toLowerCase();
              if (ext !== '.lnk' && ext !== '.url' && ext !== '.exe') return;

              const appName = filename.replace(ext, '');
              const keyWords = [appName];
              let appDetail: any = {};

              if (ext === '.lnk' || ext === '.url') {
                try {
                  appDetail = shell.readShortcutLink(filedir);
                  console.log(`[App Index] ✓ Shortcut parsed: "${appName}" → ${appDetail.target}`);
                } catch (e) {
                  console.warn(`[App Index] ✗ readShortcutLink failed for: ${filename}`);
                  // Fallback: use PowerShell to resolve shortcut
                  try {
                    // Safe quoting for PowerShell, escaping single quotes
                    const safePath = filedir.replace(/'/g, "''");
                    const psCmd = `powershell -NoProfile -Command "$sh=New-Object -ComObject WScript.Shell;$s=$sh.CreateShortcut('${safePath}');$s.TargetPath"`;
                    const target = execSync(psCmd, { encoding: 'utf8' }).trim();
                    if (target) {
                      console.log(`[App Index] ✓ PowerShell fallback success: "${appName}" → ${target}`);
                      appDetail = {
                        target: target,
                        args: '',
                        description: '',
                        cwd: '',
                        appUserModelId: '',
                      };
                    }
                  } catch (fallbackErr) {
                    console.warn(`[App Index] ✗ PowerShell fallback also failed for: ${filename}`);
                  }
                }
              } else if (ext === '.exe') {
                // For .exe files directly in the folder
                appDetail = { target: filedir };
                console.log(`[App Index] Direct .exe file: "${appName}" → ${filedir}`);
              }

              // Filter out common uninstaller executables
              // Generic logic: Only filter if the filename STARTS with 'uninstall' or 'uninst'
              // This avoids false positives for apps like 'Bulk Crap Uninstaller' or 'Revo Uninstaller'
              const targetBase = path.basename(appDetail.target).toLowerCase();
              if (
                !appDetail.target ||
                targetBase.startsWith('uninstall') ||
                targetBase.startsWith('uninst')
              ) {
                console.log(`[App Index] ✗ Filtered out: "${appName}" (uninstaller or invalid target)`);
                return;
              }

              // C:/program/cmd.exe => cmd
              keyWords.push(path.basename(appDetail.target, '.exe'));

              if (isZhRegex.test(appName)) {
                // const [, pinyinArr] = translate(appName);
                // const zh_firstLatter = pinyinArr.map((py) => py[0]);
                // // 拼音
                // keyWords.push(pinyinArr.join(''));
                // 缩写
                // keyWords.push(zh_firstLatter.join(''));
              } else {
                const firstLatter = appName
                  .split(' ')
                  .map((name) => name[0])
                  .join('');
                keyWords.push(firstLatter);
              }

              const icon = path.join(
                os.tmpdir(),
                'ProcessIcon',
                `${encodeURIComponent(appName)}.png`
              );

              const appInfo = {
                value: 'plugin',
                desc: appDetail.target,
                type: 'app',
                icon,
                pluginType: 'app',
                action: `start "dummyclient" "${appDetail.target}"`,
                keyWords: keyWords,
                name: appName,
                names: JSON.parse(JSON.stringify(keyWords)),
              };

              // 检查是否已存在相同的应用
              const existingApp = fileLists.find(app =>
                app.desc === appInfo.desc || app.name === appName
              );

              // ========================================
              // 重复处理模式选择（二选一，取消对应的注释）
              // ========================================

              // === 模式1：跳过重复（推荐给用户，当前启用）===
              if (existingApp) {
                console.warn(`[App Index] ⚠️  Skipping duplicate: "${appName}"`);
                console.warn(`   Current Source: ${filedir}`);
                console.warn(`   Existing Source: ${existingApp.desc}`);
                return; // 跳过重复的，不添加
              }

              // === 模式2：允许重复（用于调试，需要时取消注释）===
              // if (existingApp) {
              //   console.warn(`[App Index] ⚠️  DUPLICATE DETECTED!`);
              //   console.warn(`   App Name: "${appName}"`);
              //   console.warn(`   Current Source: ${filedir}`);
              //   console.warn(`   Existing Source: ${existingApp.desc}`);
              //   console.warn(`   Adding anyway (will appear in index)`);
              // }

              console.log(`[App Index] ✓ Adding app: "${appName}"`);
              console.log(`   Target: ${appDetail.target}`);
              console.log(`   Keywords: [${keyWords.join(', ')}]`);

              fileLists.push(appInfo);
              getico(appInfo);
            }
            if (isDir) {
              fileDisplay(filedir); // 递归，如果是文件夹，就继续遍历该文件夹下面的文件
            }
          }
        });
      });
    }
  });
}

export default () => {
  console.log('[App Index] ========================================');
  console.log('[App Index] Starting Windows application indexing');
  console.log('[App Index] ========================================');

  fileDisplay(filePath);
  fileDisplay(startMenu);

  // 生产环境：禁用索引统计（调试用，占用定时器资源）
  // 如需调试，取消下面的注释
  // setTimeout(() => {
  //   console.log('[App Index] ========================================');
  //   console.log(`[App Index] Indexing complete! Total apps: ${fileLists.length}`);
  //   console.log('[App Index] ========================================');
  //
  //   // 检查重复项
  //   const nameCount = new Map();
  //   const descCount = new Map();
  //
  //   fileLists.forEach(app => {
  //     nameCount.set(app.name, (nameCount.get(app.name) || 0) + 1);
  //     descCount.set(app.desc, (descCount.get(app.desc) || 0) + 1);
  //   });
  //
  //   const duplicateNames = Array.from(nameCount.entries()).filter(([name, count]) => count > 1);
  //   const duplicateDescs = Array.from(descCount.entries()).filter(([desc, count]) => count > 1);
  //
  //   if (duplicateNames.length > 0) {
  //     console.warn('[App Index] ⚠️  Duplicate app names found:');
  //     duplicateNames.forEach(([name, count]) => {
  //       console.warn(`   "${name}" appears ${count} times`);
  //       const apps = fileLists.filter(app => app.name === name);
  //       apps.forEach((app, idx) => {
  //         console.warn(`     [${idx + 1}] ${app.desc}`);
  //       });
  //     });
  //   }
  //
  //   if (duplicateDescs.length > 0) {
  //     console.warn('[App Index] ⚠️  Duplicate target paths found:');
  //     duplicateDescs.forEach(([desc, count]) => {
  //       console.warn(`   "${desc}" appears ${count} times`);
  //     });
  //   }
  // }, 3000);

  return fileLists;
};
