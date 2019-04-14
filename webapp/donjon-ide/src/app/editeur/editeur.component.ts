import { ElementGenerique } from '../models/element-generique';
import { Genre } from '../models/genre.enum';
import { Nombre } from '../models/nombre.enum';
import { Phrase } from '../models/phrase';
import { PositionSujet, PositionSujetString } from '../models/position-sujet';
import { Salle } from '../models/salle';
import { TypeElement } from '../models/type-element.enum';
import { Component, OnInit } from '@angular/core';
import { log } from 'util';

@Component({
  selector: 'app-editeur',
  templateUrl: './editeur.component.html',
  styleUrls: ['./editeur.component.css']
})
export class EditeurComponent implements OnInit {

  codeSource = `"Le nain qui voulait un trésor".

- 1 - Le jardin.
Le jardin est une salle. "Vous êtes dans un beau jardin en fleurs. Le soleil brille.".
Les fleurs (f) sont des décors du jardin.
La clé rouge est dans le jardin.
C'est une clé. "Il s'agit d'une veille clé rouillée et un peu tordue."
L'abri de jardin est une salle.
Il est à l'intérieur du jardin.
Il est sombre, humide et froid.
Les fourmis sont des animaux du jardin. "Il y en a beaucoup mais elle n'ont pas l'air agressives."
La porte rouge est une porte au sud de l'abri de jardin.
Le seau est un contenant.
Le seau est dans l'abri de jardin.
La haie est une porte au nord du jardin. Elle est fermée et ouvrable.

- 2 - La forêt et la caverne.
La forêt est une salle au nord du jardin. "Vous êtes dans une forêt sombre.".
Les arbres sont des décors de la forêt.
Les chauves souris sont dans les arbres.
Ce sont des animaux.
Les fleurs (f) sont des décors de la forêt.
Le lac est un décor de la forêt.
Il contient de l'eau.
La description du seau est ici "Ce seau n'est pas troué, je peux y mettre de l'eau.".
La caverne ténébreuse est une salle sombre à l'intérieur de la forêt.
Le dragon est un animal dans la caverne.
Le trésor est dans la caverne. "Vous êtes attiré par l'éclat de ces nombreuses richesses."
  `;

  titreJeu = "";
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

  /** salle -> déterminant, nom, féminin?, reste de la phrase */
  readonly xSujetSalle = /^(le |la |l')(.+?)(\(f\))? est une salle(.*)/gim;
  readonly xSujetContenant = /^(le |la |l')(.+?)(\(f\))? est un contenant(.*)/gim;
  readonly xSujetPorte = /^(le |la |l')(.+?)(\(f\))? est une porte(.*)/gim;
  /** élément générique positionné par rapport à complément -> determinant(1), nom(2), féminin?(3), type(4), adjectif(5), position(6), genre complément(7), complément(8) */
  // readonly xPositionElementGenerique = /^(le |la |l')(.+?)(\(f\))? est (?:un|une) (.+?)(| .+) (à l'intérieur|au sud|au nord|à l'est|à l'ouest) (du |de la |de l')(.+)/i;

  /** élément générique positionné par rapport à complément -> determinant(1), nom(2), féminin?(3), type(4), adjectifs(5), position(6), genre complément(7), complément(8) */
  // readonly xPositionElementGenerique = /^(le |la |l'|les)(.+?)(\(f\))? (?:est|sont) (?:|(?:un|une|des) (.+?)(| .+?) )((?:(?:à l'intérieur|au sud|au nord|à l'est|à l'ouest) (?:du |de la |de l'))|(?:dans (?:la |le |l')|de (?:la |l')|du ))(.+)/i;
  readonly xPositionElementGenerique = /^(le |la |l'|les)(.+?)(\(f\))? (?:est|sont) (?:|(?:un|une|des) (.+?)(| .+?) )?((?:(?:à l'intérieur|au sud|au nord|à l'est|à l'ouest) (?:du |de la |de l'|des ))|(?:dans (?:la |le |l'|les )|de (?:la |l')|du ))(.+)/i;

  /** élément générique simple -> determinant(1), nom(2), féminin?(3), type(4), adjectifs(5) */
  readonly xElementSimple = /^(le |la|l'|les)(.+?)(\(f\))? (?:est|sont) (?:un|une|des) (\S+)(| .+)/i;

  /** pronom démonstratif -> determinant(1), type(2), adjectifs(3) */
  readonly xPronomDemonstratif = /^((?:c'est (?:un|une))|(?:ce sont des)) (\S+)(| .+)/i;

  /** pronom personnel position -> position(1), complément(2)*/
  readonly xPronomPersonnelPosition = /^(?:(?:(?:il|elle) est)|(?:(?:ils|elles) sont)) (?:(?:(à l'intérieur|au sud|au nord|à l'est|à l'ouest) (?:du |de la |de l'))|(?:dans (?:la |le |l')|de (?:la |l')|du ))(.+)/i;
  /** élément générique simple -> adjectifs(1) */
  readonly xPronomPersonnel = /^(?:(?:(?:il|elle) est)|(?:(?:ils|elles) sont)) ((?:\S+[^,])(?:$| et (?:\S+)|(?:, \S+)+ et (?:\S+)))/i;

  /** élément générique placé dans complément -> déterminant(1), nom(2), féminin?(3), type(4), adjectif(5), position(6) complément(7)*/
  // readonly xEmplacementGenerique = /^(le |la |l')(.+?)(\(f\))? est (?:|(?:(?:un|une) (.+?)(| .+)))(?:dans le |dans la |dans l'| du | de la |de l')(.+?)/i;

  constructor() { }
  ngOnInit() { }

  parseCode() {
    // retirer les retours à la ligne et les espace avant et après le bloc de texte.
    const blocTexte = this.codeSource.replace(/(\r|\n)/g, "").trim();

    // séparer les commentaires (entre " ") du code
    const blocsCodeEtCommentaire = blocTexte.split('"');

    this.phrases = new Array<Phrase>();
    let indexPhrase = 0;
    // si le bloc de texte commence par " on commence avec un bloc de commentaire
    let blocSuivantEstCode = true;
    if (blocTexte[0] == '"') {
      blocSuivantEstCode = false;
    }

    // séparer les blocs en phrases sauf les commentaires
    blocsCodeEtCommentaire.forEach(bloc => {
      if (bloc != '') {
        // bloc de code, séparer les phrases (sur les '.')
        if (blocSuivantEstCode) {
          const phrasesBrutes = bloc.split('.');
          phrasesBrutes.forEach(phraseBrute => {
            this.phrases.push(new Phrase(phraseBrute, false, false, null, indexPhrase++));
          });
        } else {
          // si le bloc est un commentaire, l'ajouter tel quel
          this.phrases.push(new Phrase(bloc, true, false, null, indexPhrase++));
        }
        blocSuivantEstCode = !blocSuivantEstCode
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

      // si c'est un commentaire
      if (phrase.commentaire) {
        // si c'est le premier boc du code, il s'agit du titre
        if (phrase.ordre == 0) {
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

        // si c'est du code
      } else {


        console.log("Analyse: ", phrase);
        // Élement positionné
        result = this.xPositionElementGenerique.exec(phrase.phrase);
        if (result !== null) {
          let e = new ElementGenerique(
            result[1],
            result[2],
            this.getTypeElement(result[4]),
            new PositionSujetString(result[2], result[7], result[6]),
            this.getGenre(result[1], result[3]),
            this.getNombre(result[1]),
            (result[8] ? new Array<string>(result[8]) : new Array<string>())
          );

          // avant d'ajouter l'élément vérifier s'il existe déjà
          let filtered = this.generiques.filter(x => x.nom == e.nom);
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
            if (e.type != TypeElement.inconnu && e.type != TypeElement.aucun) {
              found.type = e.type;
            }
          } else {
            // ajouter le nouvel élément
            this.generiques.push(e);
          }

          console.log("Réslultat: test 1:", e);
          // Élément NON positionné
        } else {
          // élément générique simple
          result = this.xElementSimple.exec(phrase.phrase);
          if (result !== null) {
            let e = new ElementGenerique(
              result[1],
              result[2],
              this.getTypeElement(result[4]),
              null,
              this.getGenre(result[1], result[3]),
              this.getNombre(result[1]),
              (result[5] ? new Array<string>(result[5]) : new Array<string>())
            );
            console.log("Réslultat: test 2:", e);
            this.generiques.push(e);
          } else {
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
                // pronom personnel adjectifs
                result = this.xPronomPersonnel.exec(phrase.phrase);
                if (result !== null) {
                  console.log("resultat test 5: ", result);

                  // récupérer le dernier élément
                  let e = this.generiques.pop();
                  // attributs de l'élément précédent
                  if (result[1] && result[1].trim() !== '') {
                    // découper les attributs
                    let attributs = result[1].split(/(?:, | et )+/);
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




      // console.log("Analyse de la phrase (SALLE) : ", phrase);
      // let m = this.xSujetSalle.exec(phrase);
      // console.log(" ==> ", m);
      // // la phrase décrit une salle
      // if (m) {
      //   let salle = new Salle(m[2], m[1], this.getGenre(m[1], m[3]), Nombre.s);
      //   this.salles.push(salle);
      // }
    });

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
          retVal = TypeElement.cle;
          break;
        case "contenant":
          retVal = TypeElement.contenant;
          break;
        case "décors":
        case "décor":
        case "decor":
        case "decors":
          retVal = TypeElement.decor;
          break;
        case "humain":
          retVal = TypeElement.humain;
          break;
        case "objet":
          retVal = TypeElement.objet;
          break;
        case "porte":
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
          retVal = Nombre.s;
          break;
        case "les":
          retVal = Nombre.p;
          break;
        default:
          retVal = Nombre.s;
          break;
      }
    }
    return retVal;
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
        case "l'":
        case "les":
          if (feminin && feminin.trim() == "(f)") {
            retVal = Genre.f;
          } else {
            retVal = Genre.m;
          }
          break;
        default:
          break;
      }
    }
    return retVal;
  }

}
