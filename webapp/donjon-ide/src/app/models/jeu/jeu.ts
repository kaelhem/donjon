import { Action } from '../compilateur/action';
import { Aide } from '../commun/aide';
import { Auditeur } from '../jouer/auditeur';
import { Classe } from '../commun/classe';
import { ElementsJeuUtils } from 'src/app/utils/commun/elements-jeu-utils';
import { Lieu } from './lieu';
import { ListeEtats } from 'src/app/utils/jeu/liste-etats';
import { Objet } from './objet';
import { Regle } from '../compilateur/regle';

export class Jeu {

  constructor() {

  }

  /**
   * Titre du jeu.
   */
  titre: string;

  /** Le jeu est-il terminé ? */
  termine = false;

  classes: Classe[] = [];

  etats: ListeEtats = new ListeEtats();

  /**
   * Lieux qui constituent le jeu.
   */
  lieux: Lieu[] = [];

  // /**
  //  * Portes qui séparent les lieux.
  //  */
  // portes: Porte[] = [];

  joueur: Objet;

  /**
   * Tous les objets du jeu
   */
  objets: Objet[] = [];

  /** Un auditeur écoute un évènement en particulier.
   * Lorsque l'évènement se déclanche, on exécute les actions
   * de l'auditeur.
   */
  auditeurs: Auditeur[] = [];

  /**
   * Règles ajoutées au jeu.
   */
  regles: Regle[] = [];

  /**
   * Actions ajoutées au jeu.
   */
  actions: Action[] = [];

  /**
   * États sauvegardés
   */
  sauvegardes: string[] = [];

  aides: Aide[] = [];

  /**
   * Objets du jeu en possession du joueur.
   */
  // inventaire: Inventaire = new Inventaire();

  /**
   * Position du joueur.
   * ID d’un lieu du jeu.
   */
  // position: number;
}