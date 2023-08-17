// Copyright 2023 manufosela.
// SPDX-License-Identifier: GPL-3.0-only

"use strict";

import chalk from "chalk";
import path from "path";
import process from "child_process";
import nodeprocess from "node:process";
import { fileURLToPath } from "url";
import { readFileSync, writeFileSync } from "fs";
import inquirer from "inquirer";
import fs from "fs";

const whoami = process.execSync("whoami").toString().replace(/\n/, "");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class InstallLit {
  
  constructor() {
    this.props = {};
    this.packageJsonContent = "";
    this.step = 1;
  }

  installWC() {
    try {
      process.execSync("npm init @open-wc", { stdio: "inherit" });
      console.log("npm init @open-wc ejecutado correctamente.");
    } catch (error) {
      console.error("Error al ejecutar npm init @open-wc:", error.message);
    }
  }

  putIntoWCDirectory() {
    const dir = process
      .execSync("ls -t | head -n1")
      .toString()
      .replace(/\n/, "");
    console.log("\nDirectorio creado: " + dir);
    nodeprocess.chdir(dir);
    console.log("Directorio actual: " + nodeprocess.cwd());
  }

  getWCName() {
    const jsonPackage = JSON.parse(this.packageJsonContent);
    console.log("Nombre del webcomponent: " + jsonPackage.name);
    return jsonPackage.name;
  }

  updatePackageJsonInfo() {
    const regExp = new RegExp('"author": "' + this.props.wcname + '"', "gm");
    this.packageJsonContent = this.packageJsonContent.replace(
      regExp,
      '"author": "' + this.props.author + '"'
    );
    this.packageJsonContent = this.packageJsonContent.replace(
      /"license": "MIT"/gm,
      '"license": "' + this.props.license + '"'
    );
    this.packageJsonContent = this.packageJsonContent.replace(
      /"version": "0.0.0"/gm,
      '"version": "1.0.0"'
    );
    this.packageJsonContent = this.packageJsonContent.replace(
      /"main": "index.js"/gm,
      '"main": "' + this.props.wcname + '.js"'
    );
  }

  updateMoreInfoPackageJson() {
    const home = `  "home": "https://github.com/${this.props.author}/${this.props.wcname}"`;
    const repository = `  "repository": "git+https://github.com/${this.props.author}/${this.props.wcname}.git"`;
    const bugs = `  "bugs": "https://github.com/${this.props.author}/${this.props.wcname}/issues"`;

    this.packageJsonContent = this.packageJsonContent.replace(
      '"customElements": "custom-elements.json",',
      '"customElements": "custom-elements.json",\n' +
        home +
        ",\n" +
        repository +
        ",\n" +
        bugs +
        ","
    );
  }

  _replacePackageVersion(jsonPackage, deps) {
    const depsName = Object.keys(jsonPackage[deps]);
    console.log(jsonPackage[deps]);
    depsName.forEach((depName) => {
      console.log("check version for " + depName);
      const npmCommand = `npm view ${depName} version`;
      const packageVersion = process
        .execSync(npmCommand)
        .toString()
        .replace(/\n/, "");
      const searched =
        '"' + depName + '": "' + jsonPackage[deps][depName] + '"';
      const replacedby = '"' + depName + '": "^' + packageVersion + '"';
      console.log("searched: " + searched);
      console.log("replacedby: " + replacedby);
      this.packageJsonContent = this.packageJsonContent.replace(searched, replacedby);
    });
  }

  updateDependenciesVersions() {
    const jsonPackageParsed = JSON.parse(this.packageJsonContent);
    this._replacePackageVersion(jsonPackageParsed, "dependencies");
    this._replacePackageVersion(jsonPackageParsed, "devDependencies");
  }

  installNewPackageJson() {
    try {
      process.execSync("npm install", { stdio: "inherit" });
      console.log("Dependencias actualizadas correctamente.");
    } catch (error) {
      console.error("Error al actualizar las dependencias:", error.message);
    }
  }

  fixPackageJsonVulnerabilities() {
    try {
      process.execSync("npm audit fix", { stdio: "inherit" });
      console.log("Vulnerabilidades arregladas correctamente.");
    } catch (error) {
      console.error("Error al arreglar las vulnerabilidades:", error.message);
    }
  }

  getWCClassName(wcname) {
    return wcname
      .split("-")
      .map((part) => {
        return part.charAt(0).toUpperCase() + part.slice(1);
      })
      .join("");
  }

  generateWCStyleFile(directorioWC) {
    const WCClassName = this.props.WCClassName;
    console.log(`Generando ${WCClassName}Style.js...`);
    let content = readFileSync(
      path.join(__dirname, "..", "templates", "wc-name-style.js"),
      "utf8"
    );
    let WCStylesFilename = WCClassName + "Styles.js";
    let goodContent = content.replace(/wcName/gm, WCClassName);
    writeFileSync(
      path.join(directorioWC, "src", WCStylesFilename),
      goodContent
    );
  }

  updateWCStyleFile(directorioWC) {
    const WCFilename = this.props.WCClassName + ".js";
    const WCStylesFilename = this.props.WCClassName + "Styles.js";

    let WCFileContent = readFileSync(
      path.join(directorioWC, "src", WCFilename),
      "utf8"
    );
    const pattern = /static styles = css`[^`]*`;/g;
    WCFileContent = WCFileContent.replace(
      pattern,
      "static styles = [" + this.props.WCClassName + "Styles];"
    );
    WCFileContent = WCFileContent.replace(
      "import { html, css, LitElement } from 'lit';",
      "import { html, LitElement } from 'lit';\nimport { " +
        this.props.WCClassName +
        "Styles } from './" +
        WCStylesFilename +
        "';"
    );
    writeFileSync(path.join(directorioWC, "src", WCFilename), WCFileContent);
  }

  updateLicenseFile(directorioWC) {
    const licenseContent = readFileSync(
      path.join(
        __dirname,
        "..",
        "templates",
        "LICENSE_" + this.props.license.toUpperCase() + ".md"
      ),
      "utf8"
    );
    writeFileSync(path.join(directorioWC, "LICENSE"), licenseContent);
  }

  _generarColorAleatorio() {
    const colorFondo = Math.floor(Math.random() * 16777215).toString(16);
    const colorTexto = Math.floor(Math.random() * 16777215).toString(16);
    const brilloFondo = (parseInt(colorFondo, 16) >> 16) * 0.299 + (parseInt(colorFondo, 16) >> 8 & 0xff) * 0.587 + (parseInt(colorFondo, 16) & 0xff) * 0.114;
    const brilloTexto = (parseInt(colorTexto, 16) >> 16) * 0.299 + (parseInt(colorTexto, 16) >> 8 & 0xff) * 0.587 + (parseInt(colorTexto, 16) & 0xff) * 0.114;

    const diferenciaMinima = 125;
    const diferenciaBrillo = Math.abs(brilloFondo - brilloTexto);
    const coloresValidos = diferenciaBrillo >= diferenciaMinima;
  
    return coloresValidos ? { backgroundColorNames: `#${colorFondo}`, foregroundColorNames: `#${colorTexto}` } : this._generarColorAleatorio();
  }

  createVSCodeDirectory(directorioWC) {
    const vscodeDirectory = path.join(directorioWC, ".vscode");
    const vscodeSettingsFile = path.join(vscodeDirectory, "settings.json");
    let vscodeSettingsContent = readFileSync(
      path.join(__dirname, "..", "templates", "vscode-settings.json"),
      "utf8"
    );
    const { backgroundColorNames, foregroundColorNames } = this._generarColorAleatorio();
    vscodeSettingsContent = vscodeSettingsContent.replace("BGCOLOR", "#" + Math.floor(Math.random()*16777215).toString(16));
    vscodeSettingsContent = vscodeSettingsContent.replace("TITLEBGCOLOR", backgroundColorNames);
    vscodeSettingsContent = vscodeSettingsContent.replace("TITLEFGCOLOR", foregroundColorNames);
    try {
      fs.access(".vscode", fs.constants.F_OK, (err) => {
        if (err) {
          process.execSync("mkdir .vscode", { stdio: "inherit" });
          console.log("Directorio .vscode creado correctamente.");    
        }
      });
      
    } catch (error) {
      console.error(chalk.red("Error al crear el directorio .vscode:"), error.message);
    }
    writeFileSync(vscodeSettingsFile, vscodeSettingsContent);
  }

  async main() {
    this.step = 1;
    console.log(chalk.green("Bienvenido a install-lit!"));

    const prompts = [
      {
        type: "input",
        name: "author",
        message: "Github user or author's name",
        default: whoami,
      },
      {
        type: "list",
        name: "license",
        message: "LICENSE type",
        default: "Apache-2.0",
        choices: ["MIT", "Apache-2.0", "ISC", "GPL-3.0"],
      },
      {
        type: "confirm",
        name: "start",
        message: "Would you like to create a Lit webcomponent?",
        default: false,
        choices: ["Yes", "No"],
      },
    ];
    
    this.props = await inquirer.prompt(prompts); 
    console.log(this.props);
    
    if (this.props.start) {
      /* Instalar el paquete npm init @open-wc para crear el web-component base */
      console.log(`${chalk.blue(this.step++)}.- Install WC`);
      this.installWC();

      /* Leer el directorio actual el directorio creado mas recientemente y entrar en él */
      console.log(`${chalk.blue(this.step++)}.- Move to WC directory`);
      this.putIntoWCDirectory();

      /* Leer el fichero package.json */
      console.log(`${chalk.blue(this.step++)}.- Read package.json`);
      this.packageJsonContent = readFileSync("package.json", "utf8");

      /* Leer el fichero package.json y extraer el nombre del webcomponent de la propiedad name */
      console.log(`${chalk.blue(this.step++)}.- Get WC name from package.json`);
      this.props.wcname = this.getWCName(this);

      /* Actualizar datos de package.json */
      console.log(`${chalk.blue(this.step++)}.- Update package.json information`);
      this.updatePackageJsonInfo();

      /* Actualizar las versiones de las dependencias */
      console.log(`${chalk.blue(this.step++)}.- Update dependencies versions`);
      this.updateDependenciesVersions();

      /* Añadir las referencias a home, repositorio y bugs */
      console.log(`${chalk.blue(this.step++)}.- Update more info of package.json`);
      this.updateMoreInfoPackageJson();

      /* Escribir el neuvo fichero package.json */
      console.log(`${chalk.blue(this.step++)}.- Write new package.json`);
      writeFileSync("package.json", this.packageJsonContent, "utf8");

      /* Instalar las dependencias */
      console.log(`${chalk.blue(this.step++)}.- Install new package.json`);
      this.installNewPackageJson();

      /* Arreglar posibles vulnerabilidades del package.json */
      console.log(`${chalk.blue(this.step++)}.- Fix package.json vulnerabilities`);
      this.fixPackageJsonVulnerabilities();

      /* Generar nombre del webcomponent en camelCase */
      console.log(`${chalk.blue(this.step++)}.- Get WCClassName`);
      this.props.WCClassName = this.getWCClassName(this.props.wcname);

      /* Obtener directorio de trabajo del script */
      console.log(`${chalk.blue(this.step++)}.- Get working directory`);
      const directorioWC = nodeprocess.cwd();

      /* Generar fichero src/wc-name-style.js */
      console.log(`${chalk.blue(this.step++)}.- Generate WCStyleFile from template`);
      this.generateWCStyleFile(directorioWC);

      /* Insertar el fichero src/wc-name-style.js en el fichero src/wc-name.js */
      console.log(`${chalk.blue(this.step++)}.- Update WCStyleFile`);
      this.updateWCStyleFile(directorioWC);

      /* Modificar el fichero LICENSE con la licencia seleccionada */
      console.log(`${chalk.blue(this.step++)}.- Update LICENSE file`);
      this.updateLicenseFile(directorioWC);

      /* Crear directorio .vscode con settings.json y colores aleatorios */
      console.log(`${chalk.blue(this.step++)}.- Configure .vscode directory`);
      this.createVSCodeDirectory(directorioWC);
    } else {
      console.log(chalk.red(
        "\n\n* * *   STOPED Generator Lit Element Base by User   * * *\n"
      ));
      nodeprocess.exit(0);
    }
  }
}
