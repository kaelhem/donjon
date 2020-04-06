import 'brace';
import 'brace/mode/text';
import '../../mode-donjon.js';
// import 'brace/mode/javascript';
// import 'brace/theme/github';
import 'brace/theme/chrome';

import * as FileSaver from 'file-saver';

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { AceConfigInterface } from 'ngx-ace-wrapper';
import { Compilateur } from '../utils/compilateur';
import { Generateur } from '../utils/generateur';
import { HttpClient } from '@angular/common/http';
import { Jeu } from '../models/jeu/jeu';
import { Monde } from '../models/compilateur/monde';
import { Regle } from '../models/compilateur/regle';
import { StringUtils } from '../utils/string.utils';

@Component({
  selector: 'app-editeur',
  templateUrl: './editeur.component.html',
  styleUrls: ['./editeur.component.scss']
})
export class EditeurComponent implements OnInit {

  // @ViewChild('codeEditor', { static: true }) codeEditorElmRef: ElementRef;

  public config: AceConfigInterface = {
    // mode: 'text',
    mode: 'donjon',
    minLines: 80,
    theme: 'chrome',
    readOnly: false,
    tabSize: 2,
    fontSize: 18,
    showGutter: true,
    showLineNumbers: true,
    showPrintMargin: false,
    hScrollBarAlwaysVisible: false,
    wrap: true,
  };

  mode: "aucun" | "jeu" | "apercu" = "aucun";

  monde: Monde = null;
  regles: Regle[] = null;
  erreurs: string[] = null;
  jeu: Jeu = null;
  codeSource = "";
  nomExemple = "exemple2";

  constructor(
    private http: HttpClient,
  ) {

  }

  ngOnInit(): void {
    // https://www.npmjs.com/package/ngx-ace-wrapper
    // => this.codeEditorElmRef["directiveRef"] : directiveRef;
    // => this.codeEditorElmRef["directiveRef"].ace() : Returns the Ace instance reference for full API access.
  }

  onParseCode() {
    // interpréter le code
    let resultat = Compilateur.parseCode(this.codeSource);
    this.monde = resultat.monde;
    this.regles = resultat.regles;
    this.erreurs = resultat.erreurs;
    // voir le résultat
    this.mode = "apercu";
  }

  onChargerExemple() {
    const nomFichierExemple = StringUtils.nameToSafeFileName(this.nomExemple, ".djn");
    if (nomFichierExemple) {
      this.http.get('assets/exemples/' + nomFichierExemple, { responseType: 'text' })
        .subscribe(texte => this.codeSource = texte);
    }
  }

  onOuvrirFichier(evenement) {
    // fichier choisi par l’utilisateur
    const file = evenement.target.files[0];
    if (file) {
      let fileReader = new FileReader();
      // quand lu, l’attribuer au code source
      fileReader.onload = (progressEvent) => {
        this.codeSource = fileReader.result as string;
      };
      // lire le fichier
      fileReader.readAsText(file);
    }
  }

  onSauvegarder() {
    // Note: Ie and Edge don't support the new File constructor,
    // so it's better to construct blobs and use saveAs(blob, filename)
    const file = new File([this.codeSource], "donjon.djn", { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(file);
  }

  onJouer() {
    // interpréter le code
    let resultat = Compilateur.parseCode(this.codeSource);
    this.monde = resultat.monde;
    this.regles = resultat.regles;
    this.erreurs = resultat.erreurs;
    // générer le jeu
    this.jeu = Generateur.genererJeu(this.monde, this.regles);
    // commencer le jeu
    this.mode = "jeu";
  }



}
