var vscode = require('vscode');
var fs = require('fs');
var replaceExt = require('replace-ext');
var compileSass = require('./lib/sass.node.spk.js');

var CompileSassExtension = function() {

    // Private fields ---------------------------------------------------------

    var outputChannel;

    // Constructor ------------------------------------------------------------

    outputChannel = vscode.window.createOutputChannel("EasySass");

    // Private functions ------------------------------------------------------

    function handleResult(outputPath, result) {

        if (result.status == 0) {

            try {                
                fs.writeFileSync(outputPath, result.text, { flags: "w" });
            } catch (e) {
                outputChannel.appendLine("Failed to generate CSS: " + e);
            }

            outputChannel.appendLine("Successfully generated CSS: " + outputPath);
        }
        else {

            if (result.formatted) {
                outputChannel.appendLine(result.formatted);
            } else if (result.message) {
                outputChannel.appendLine(result.message);
            } else {
                outputChannel.appendLine("Failed to generate CSS from SASS, but the error is unknown.");
            }

            vscode.window.showErrorMessage('EasySass: could not generate CSS file. See Output panel for details.');
            outputChannel.show(true);
        }
    }

    function compileFile(path) {

        outputChannel.clear();

        var configuration = vscode.workspace.getConfiguration('easysass');

        if (configuration.generateExpanded) {
            compileSass(path, { style: compileSass.Sass.style.expanded }, function(result) {
                
                handleResult(replaceExt(path, '.css'), result);
            });
        }

        if (configuration.generateMinified) {
            compileSass(path, { style: compileSass.Sass.style.compressed}, function(result) {

                handleResult(replaceExt(path, '.min.css'), result);
            });
        }
    }

    // Public -----------------------------------------------------------------

    return {

        OnSave: function (document) {

            if (document.fileName.toLowerCase().endsWith('.scss') ||
                document.fileName.toLowerCase().endsWith('.sass')) {

                compileFile(document.fileName);                
            }
        },
        CompileAll: function() {

            vscode.workspace.findFiles("**/*.s[ac]ss").then(function(files) {
                for (var i = 0; i < files.length; i++) {
                    
                    compileFile(files[i].fsPath);
                }
            });            
        }
    };
};

function activate(context) {

    var extension = CompileSassExtension();

    vscode.workspace.onDidSaveTextDocument(function(document) { extension.OnSave(document) });

    var disposable = vscode.commands.registerCommand('easysass.compileAll', function() {
        extension.CompileAll();
    });

    context.subscriptions.push(disposable);
}

function deactivate() {
}

exports.activate = activate;
exports.deactivate = deactivate;