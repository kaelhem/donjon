import 'brace';
import 'brace/mode/text';
// import 'brace/mode/javascript';
// import 'brace/theme/github';
import 'brace/theme/chrome';

import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';

import { AceConfigInterface } from 'ngx-ace-wrapper';
import { Definition } from '../models/definition';
import { ElementGenerique } from '../models/element-generique';
import { Genre } from '../models/genre.enum';
import { Nombre } from '../models/nombre.enum';
import { Phrase } from '../models/phrase';
import { PositionSujetString } from '../models/position-sujet';
import { Salle } from '../models/salle';
import { TypeElement } from '../models/type-element.enum';

@Component({
  selector: 'app-editeur',
  templateUrl: './editeur.component.html',
  styleUrls: ['./editeur.component.scss']
})
export class EditeurComponent implements OnInit {

  @ViewChild('codeEditor', { static: true }) codeEditorElmRef: ElementRef;

  public config: AceConfigInterface = {
    mode: 'text',
    minLines: 80,
    theme: 'chrome',
    readOnly : false,
    tabSize : 2,
    fontSize: 18,
    showGutter: true,
    showLineNumbers: true,
    showPrintMargin: false,
    hScrollBarAlwaysVisible: false,
    
  };

  codeSource = `"Le nain qui voulait un trésor".

- 1 - Le jardin.
Le jardin est une salle. "Vous êtes dans un beau jardin en fleurs. Le soleil brille.".
Les fleurs (f) sont des décors du jardin.
Une clé rouge est dans le jardin. "Il s'agit d'une veille clé rouillée et un peu tordue."
La clé verte est dans le jardin.
C'est une clé.
La clé rouge est en fer, légère et rouillée.
L'abri de jardin est une salle.
Il est à l'intérieur du jardin.
Il est sombre, humide et froid.
Les fourmis sont des animaux du jardin. "Il y en a beaucoup mais elle n'ont pas l'air agressives."
La porte rouge est une porte au sud de l'abri de jardin.
La porte rouge est fermée et n'est pas ouvrable.
La clé rouge ouvre la porte rouge.
Le seau est un contenant.
Le seau est dans l'abri de jardin.
La haie est une porte au nord du jardin. Elle est fermée et ouvrable.

- 2 - La forêt et la caverne.
La forêt est une salle au nord du jardin. "Vous êtes dans une forêt sombre.".
Les arbres sont des décors de la forêt.
Il y a des chauves-souris dans les arbres.
Elles sont douces et gentilles.
Ce sont des animaux.
Les fleurs (f) sont des décors de la forêt.
Le lac est un décor de la forêt.
Il contient de l'eau.
La caverne ténébreuse est une salle sombre à l'intérieur de la forêt.
Le dragon est un animal dans la caverne.
Le trésor est dans la caverne. "Vous êtes attiré par l'éclat de ces nombreuses richesses."
`;

  titreJeu = "";

  typesUtilisateur: Map<string, Definition>;

  phrases: Phrase[];
  generiques: ElementGenerique[];

  salles: Salle[];
  decors: ElementGenerique[];
  contenants: ElementGenerique[];
  portes: ElementGenerique[];
  cles: ElementGenerique[];
  animaux: ElementGenerique[];
  objets: ElementGenerique[];
  aucuns: ElementGenerique[];



  /** élément générique positionné par rapport à complément -> determinant(1), nom(2), féminin?(3), type(4), attributs(5), position(6), genre complément(7), complément(8) */
  readonly xPositionElementGeneriqueDefini = /^(le |la |l'|les )(.+?)(\(f\))? (?:est|sont) (?:|(?:un|une|des) (.+?)(| .+?) )?((?:(?:à l'intérieur|au sud|au nord|à l'est|à l'ouest) (?:du |de la |de l'|des ))|(?:dans (?:la |le |l'|les )|de (?:la |l')|du ))(.+)/i;

  // readonly xPositionElementGeneriqueIndefini = /^(un |une |des )(\S+?) (.+?)(\(f\))? (?:est|sont) ((?:(?:à l'intérieur|au sud|au nord|à l'est|à l'ouest) (?:du |de la |de l'|des ))|(?:dans (?:la |le |l'|les )|de (?:la |l')|du ))(.+)/i;
  /** élément générique positionné par rapport à complément :
   * -> soit : determinant(1)), type(2), nom(2+3), attributs(3), féminin?(4), position(9), complément(10)
   * -> soit : determinant(5), type(6), nom(6+7), attributs(7), féminin?(8), position(9), complément(10)
   */
  readonly xPositionElementGeneriqueIndefini = /^(?:(?:il y a (un |une |des |du |de l'|[1-9]\d* )(\S+)(?: (.+?))?(\(f\))?)|(?:(un |une |des |du |de l')(\S+)(?: (.+?))?(\(f\))? (?:est|sont))) ((?:(?:à l'intérieur|au sud|au nord|à l'est|à l'ouest) (?:du |de la |de l'|des ))|(?:dans (?:la |le |l'|les )))(.+)/i;
  // readonly xPositionElementGeneriqueIlya = /^il y a (un |une |des |du |de l')(.+?)(\(f\))? ((?:(?:à l'intérieur|au sud|au nord|à l'est|à l'ouest) (?:du |de la |de l'|des ))|(?:dans (?:la |le |l'|les )))(.+)/i;

  /** élément générique simple -> determinant(1), nom(2), féminin?(3), type(4), attributs(5) */
  readonly xDefinitionTypeElement = /^(le |la|l'|les)(.+?)(\(f\))? (?:est|sont) (?:un|une|des) (\S+)(| .+)/i;

  /** pronom démonstratif -> determinant(1), type(2), attributs(3) */
  readonly xPronomDemonstratif = /^((?:c'est (?:un|une))|(?:ce sont des)) (\S+)(| .+)/i;

  /** pronom personnel position -> position(1), complément(2) */
  readonly xPronomPersonnelPosition = /^(?:(?:(?:il|elle) est)|(?:(?:ils|elles) sont)) (?:(?:(à l'intérieur|au sud|au nord|à l'est|à l'ouest) (?:du |de la |de l'))|(?:dans (?:la |le |l')|de (?:la |l')|du ))(.+)/i;
  /** pronom personnel -> attributs(1) */
  readonly xPronomPersonnelAttribut = /^(?:(?:(?:il|elle) est)|(?:(?:ils|elles) sont))((?!une |un |des ) (?:.+[^,])(?:$| et (?:.+[^,])|(?:, .+[^,])+ et (?:.+[^,])))/i;

  /** élément générique -> déterminant (1), nom (2), féminin?(3) attributs(4).
   * ex: Le champignon est brun et on peut le cuillir.
   */
  readonly xElementSimpleAttribut = /^(le |la |l'|les )(.+?)(\(f\))? (?:est|sont) ((?!une |un |des )(?:.+[^,])(?:$| et (?:.+[^,])|(?:, .+[^,])+ et (?:.+[^,])))/i;

  readonly xNombrePluriel = /^[2-9]\d*$/;

  constructor() {
    this.typesUtilisateur = new Map();
  }

  ngOnInit(): void {

    // // Éditeur de code
    // const elementRef = this.codeEditorElmRef.nativeElement;
    // const editorOptions: Partial<ace.Ace.EditorOptions> = {
    //   highlightActiveLine: true,
    //   minLines: 10,
    //   maxLines: Infinity,
    // };

    // this.codeEditor = ace.edit(elementRef, editorOptions);
    // this.codeEditor.setTheme(THEME);

    // ace.config.setModuleUrl("ace/mode/donjon", "assets/mode-donjon.js");

    // this.codeEditor.getSession().setMode("ace/mode/donjon");

    // this.codeEditor.setShowFoldWidgets(true); // for the scope fold feature


  }

  // Élement simple non positionné
  testerElementSimple(phrase: Phrase): boolean {
    let e: ElementGenerique = null;

    let determinant: string;
    let nom: string;
    let intituleType: string;
    let type: TypeElement;
    let genre: Genre;
    let attributsString: string;
    let attributs: string[];
    let nombre: Nombre;
    let quantite: number;
    let position: PositionSujetString;

    // élément générique simple avec type d'élément (ex: le champignon est un décor)
    let result = this.xDefinitionTypeElement.exec(phrase.phrase);
    if (result !== null) {

      determinant = result[1] ? result[1].toLowerCase() : null;
      nom = result[2];
      intituleType = result[4];
      type = this.getTypeElement(result[4]);
      genre = this.getGenre(result[1], result[3]);
      nombre = this.getNombre(result[1]);
      quantite = this.getQuantite(result[1]);
      attributsString = result[5];
      attributs = this.getAttributs(attributsString);
      position = null;

      this.addOrUpdDefinition(nom, nombre, intituleType, attributs);

      e = new ElementGenerique(
        determinant,
        nom,
        intituleType,
        type,
        position,
        genre,
        nombre,
        quantite,
        attributs,
      );

    } else {
      // élément simple avec attributs (ex: le champignon est brun et on peut le cueillir)
      result = this.xElementSimpleAttribut.exec(phrase.phrase);
      if (result != null) {
        // attributs ?
        let attributs = null;
        if (result[4] && result[4].trim() !== '') {
          // découper les attributs qui sont séparés par des ', ' ou ' et '
          attributs = this.getAttributs(result[4]);
        }
        e = new ElementGenerique(
          result[1] ? result[1].toLowerCase() : null,
          result[2],
          "",
          TypeElement.aucun,
          null,
          this.getGenre(result[1], result[3]),
          this.getNombre(result[1]),
          this.getQuantite(result[1]),
          (attributs ? attributs : new Array<string>()),
        );
      }
    }

    // s'il y a un résultat, l'ajouter
    if (e) {
      // avant d'ajouter l'élément vérifier s'il existe déjà
      let filtered = this.generiques.filter(x => x.nom === e.nom);
      if (filtered.length > 0) {
        // mettre à jour l'élément existant le plus récent.
        let found = filtered[filtered.length - 1];
        // - type d'élément
        if (e.type !== TypeElement.aucun) {
          // s'il y avait déjà un type défini, c'est un autre élément
          if (found.type !== TypeElement.aucun) {
            this.generiques.push(e);
          } else {
            // sinon, définir le type
            found.type = e.type;
          }
        }
        // - attributs
        if (e.attributs.length > 0) {
          found.attributs = found.attributs.concat(e.attributs);
        }
      } else {
        // ajouter le nouvel élément
        this.generiques.push(e);
      }

      return true; // trouvé un résultat
    } else {
      return false; // rien trouvé
    }

  }

  addOrUpdDefinition(intitule: string, nombre: Nombre, typeParent: string, attributs: string[]) {
    // mise à jour
    if (this.typesUtilisateur.has(intitule)) {
      let found = this.typesUtilisateur.get(intitule);
      found.typeParent = typeParent;
      found.attributs.concat(attributs);
      // ajout
    } else {
      const definition = new Definition(intitule, typeParent, nombre, attributs);
      this.typesUtilisateur.set(intitule, definition)
    }
  }



  // Élement positionné
  testerPosition(phrase: Phrase): boolean {

    let e: ElementGenerique = null;

    let determinant: string;
    let nom: string;
    let intituleType: string;
    let type: TypeElement;
    let genre: Genre;
    let attributsString: string;
    let attributs: string[];
    let nombre: Nombre;
    let position: PositionSujetString;

    // élément positionné défini (la, le, les)
    let result = this.xPositionElementGeneriqueDefini.exec(phrase.phrase);
    if (result !== null) {
      e = new ElementGenerique(
        result[1] ? result[1].toLowerCase() : null,
        result[2],
        result[4],
        this.getTypeElement(result[4]),
        new PositionSujetString(result[2], result[7], result[6]),
        this.getGenre(result[1], result[3]),
        this.getNombre(result[1]),
        this.getQuantite(result[1]),
        (result[8] ? new Array<string>(result[8]) : new Array<string>()),
      );
      // élément positionné avec "un/une xxxx est" soit "il y a un/une xxxx"
    } else {
      result = this.xPositionElementGeneriqueIndefini.exec(phrase.phrase);

      if (result != null) {
        // selon le type de résultat ("il y a un xxx" ou "un xxx est")
        let offset = result[1] ? 0 : 4;
        determinant = result[1 + offset] ? result[1 + offset].toLowerCase() : null;
        intituleType = result[2 + offset];
        type = this.getTypeElement(intituleType);
        attributsString = result[3 + offset];
        attributs = this.getAttributs(attributsString);
        // s'il y a des attributs, prendre uniquement le 1er pour le nom
        if (attributs.length > 0) {
          nom = result[2 + offset] + " " + attributs[0];
        } else {
          nom = result[2 + offset];
        }
        genre = this.getGenre(result[1 + offset], result[4 + offset]);
        nombre = this.getNombre(result[1 + offset]);
        position = new PositionSujetString(result[2], result[10], result[9]);

        e = new ElementGenerique(
          determinant,
          nom,
          intituleType,
          type,
          position,
          genre,
          nombre,
          this.getQuantite(determinant),
          attributs,
        );
      }

    }
    // s'il y a un résultat, l'ajouter
    if (e) {
      // avant d'ajouter l'élément vérifier s'il existe déjà
      let filtered = this.generiques.filter(x => x.nom === e.nom);
      if (filtered.length > 0) {
        // mettre à jour l'élément existant le plus récent.
        let found = filtered[filtered.length - 1];
        // - position
        if (e.positionString) {
          // s'il y avait déjà une position définie, c'est un autre élément !
          if (found.positionString) {
            this.generiques.push(e);
          } else {
            // sinon, ajouter la position
            found.positionString = e.positionString;
          }
        }

        // - attributs
        if (e.attributs.length > 0) {
          found.attributs = found.attributs.concat(e.attributs);
        }
        // - type élément
        if (e.type !== TypeElement.inconnu && e.type !== TypeElement.aucun) {
          found.type = e.type;
        }
      } else {
        // ajouter le nouvel élément
        this.generiques.push(e);
      }
      return true; // trouvé un résultat
    } else {
      return false; // rien trouvé
    }
  }

  parseCode() {
    // retirer les retours à la ligne et les espace avant et après le bloc de texte.
    const blocTexte = this.codeSource.replace(/(\r|\n)/g, "").trim();

    // séparer les commentaires (entre " ") du code
    const blocsCodeEtCommentaire = blocTexte.split('"');

    this.phrases = new Array<Phrase>();
    let indexPhrase = 0;
    // si le bloc de texte commence par " on commence avec un bloc de commentaire
    let blocSuivantEstCode = true;
    if (blocTexte[0] === '"') {
      blocSuivantEstCode = false;
    }

    // séparer les blocs en phrases sauf les commentaires
    blocsCodeEtCommentaire.forEach(bloc => {
      if (bloc !== '') {
        // bloc de code, séparer les phrases (sur les '.')
        if (blocSuivantEstCode) {
          const phrasesBrutes = bloc.split('.');
          phrasesBrutes.forEach(phraseBrute => {
            const phraseNettoyee = phraseBrute.replace('.', '').trim();
            if (phraseNettoyee !== '') {
              this.phrases.push(new Phrase(phraseNettoyee, false, false, null, indexPhrase++));
            }
          });
        } else {
          // si le bloc est un commentaire, l'ajouter tel quel
          this.phrases.push(new Phrase(bloc, true, false, null, indexPhrase++));
        }
        blocSuivantEstCode = !blocSuivantEstCode;
      }
    });

    console.log("Voici les phrases: ", this.phrases);

    // retrouver les éléments dans le code source
    this.salles = [];
    this.decors = [];
    this.contenants = [];
    this.portes = [];
    this.cles = [];
    this.animaux = [];
    this.objets = [];
    this.aucuns = [];

    this.generiques = new Array<ElementGenerique>();
    let result: RegExpExecArray;
    this.phrases.forEach(phrase => {

      // 1) COMMENTAIRE
      if (phrase.commentaire) {
        // si c'est le premier boc du code, il s'agit du titre
        if (phrase.ordre === 0) {
          this.titreJeu = phrase.phrase;
          // sinon, le commentaire se rapporte au dernier sujet
        } else {
          // récupérer le dernier élément
          let e = this.generiques.pop();
          // mettre le commentaire de l'élément précédent
          e.description = phrase.phrase;
          // remettre l'élément à jour
          this.generiques.push(e);
        }
        phrase.traitee = true;

        // 2) CODE DESCRIPTIF
      } else {

        console.log("Analyse: ", phrase);

        // 1 - TESTER POSITION
        let found = this.testerPosition(phrase);
        if (!found) {
          // 2 - TESTER ELEMENT SIMPLE (NON positionné)
          found = this.testerElementSimple(phrase);
          if (!found) {
            // 3 - LE RESTE
            // pronom démonstratif
            result = this.xPronomDemonstratif.exec(phrase.phrase);
            if (result !== null) {
              // récupérer le dernier élément
              let e = this.generiques.pop();
              // type de l'élément précédent
              if (result[2] && result[2].trim() !== '') {
                e.type = this.getTypeElement(result[2]);
              }
              // attributs de l'élément précédent
              if (result[3] && result[3].trim() !== '') {
                e.attributs.push(result[3]);
              }
              // remettre l'élément à jour
              this.generiques.push(e);
              console.log("Réslultat: test 3:", e);
            } else {
              // pronom personnel position
              result = this.xPronomPersonnelPosition.exec(phrase.phrase);
              if (result !== null) {
                console.log("resultat test 4: ", result);

                // récupérer le dernier élément
                let e = this.generiques.pop();
                // attributs de l'élément précédent
                e.positionString = new PositionSujetString(e.nom, result[2], result[1]),
                  // remettre l'élément à jour
                  this.generiques.push(e);
                console.log("Réslultat: test 4:", e);
              } else {
                // pronom personnel attributs
                result = this.xPronomPersonnelAttribut.exec(phrase.phrase);
                if (result !== null) {
                  console.log("resultat test 5: ", result);

                  // récupérer le dernier élément
                  let e = this.generiques.pop();
                  // attributs de l'élément précédent
                  if (result[1] && result[1].trim() !== '') {
                    // découper les attributs
                    const attributs = this.getAttributs(result[1]);
                    e.attributs = e.attributs.concat(attributs);
                  }
                  // remettre l'élément à jour
                  this.generiques.push(e);
                  console.log("Réslultat: test 5:", e);
                } else {
                  console.log("Pas de résultat test 5.");
                }
              }

            }








          }

        }
      }
    });

    console.log("definitions: ", this.typesUtilisateur);

    this.generiques.forEach(el => {

      switch (el.type) {
        case TypeElement.salle:
          this.salles.push(el);
          break;

        case TypeElement.decor:
          this.decors.push(el);
          break;

        case TypeElement.contenant:
          this.contenants.push(el);
          break;

        case TypeElement.animal:
          this.animaux.push(el);
          break;

        case TypeElement.porte:
          this.portes.push(el);
          break;

        case TypeElement.cle:
          this.cles.push(el);
          break;

        case TypeElement.objet:
        case TypeElement.inconnu:
        case TypeElement.aucun:
          this.objets.push(el);
          break;

        case TypeElement.aucun:
        case TypeElement.inconnu:
          this.aucuns.push(el);
          break;

        default:
          break;
      }

    });

  }

  getTypeElement(typeElement: string): TypeElement {
    let retVal = TypeElement.aucun;

    if (typeElement) {
      switch (typeElement.trim().toLocaleLowerCase()) {
        case "animal":
        case "animaux":
          retVal = TypeElement.animal;
          break;
        case "clé":
        case "cle":
        case "clés":
        case "cles":
          retVal = TypeElement.cle;
          break;
        case "contenant":
        case "contenants":
          retVal = TypeElement.contenant;
          break;
        case "décors":
        case "décor":
        case "decor":
        case "decors":
          retVal = TypeElement.decor;
          break;
        case "humain":
        case "humains":
          retVal = TypeElement.humain;
          break;
        case "objet":
        case "objets":
          retVal = TypeElement.objet;
          break;
        case "porte":
        case "portes":
          retVal = TypeElement.porte;
          break;
        case "salle":
          retVal = TypeElement.salle;
          break;

        default:
          retVal = TypeElement.inconnu;
          break;
      }
    }
    return retVal;
  }

  getNombre(determinant: string) {
    let retVal = Nombre.s;
    if (determinant) {
      switch (determinant.trim().toLocaleLowerCase()) {
        case "le":
        case "la":
        case "l'":
        case "1":
        case "un":
        case "une":
          retVal = Nombre.s;
          break;
        case "les":
        case "des":
        case "deux":
        case "trois":
          retVal = Nombre.p;
          break;
        case "du":
        case "de la":
        case "de l'":
          retVal = Nombre.i;
          break;

        default:
          if (this.xNombrePluriel.exec(determinant.trim()) !== null) {
            retVal = Nombre.p;
          } else {
            retVal = Nombre.s;
          }
          break;
      }
    }
    return retVal;
  }

  getQuantite(determinant: string): number {
    let retVal = 0;
    if (determinant) {
      switch (determinant.trim().toLocaleLowerCase()) {
        case "le":
        case "la":
        case "l'":
        case "1":
        case "un":
        case "une":
          retVal = 1;
          break;
        case "deux":
          retVal = 2;
          break;
        case "trois":
          retVal = 3;
          break;
        case "les":
        case "des":
          retVal = -1;
          break;
        case "du":
        case "de la":
        case "de l'":
          retVal = -1;
          break;

        default:
          if (this.xNombrePluriel.exec(determinant.trim()) !== null) {
            retVal = +(determinant.trim());
          } else {
            retVal = 0;
          }
          break;
      }
    }
    return retVal;
  }

  /** Obtenir une liste d'attributs sur base d'une châine d'attributs séparés par des "," et un "et" */
  getAttributs(attributsString: string): string[] {
    if (attributsString && attributsString.trim() !== '') {
      // découper les attributs qui sont séparés par des ', ' ou ' et '
      return attributsString.split(/(?:, | et )+/);
    } else {
      return new Array<string>();
    }
  }

  /** Obtenir le genre d'un élément du donjon. */
  getGenre(determinant: string, feminin: string): Genre {
    let retVal = Genre.n;

    if (determinant) {
      switch (determinant.trim().toLocaleLowerCase()) {
        case "le":
          retVal = Genre.m;
          break;
        case "la":
          retVal = Genre.f;
          break;

        default:
          if (feminin && feminin.trim() === "(f)") {
            retVal = Genre.f;
          } else {
            retVal = Genre.m;
          }
          break;
      }
    }
    return retVal;
  }

}
