import {Color} from '@/common/types';

export const enum MOVE {
    FORWARD = 'FORWARD',
    LARBOARD = 'LARBOARD',
    STARBOARD = 'STARBOARD',
}

export const enum GAME_STATUS {
    CLEAR = 'CLEAR',
    RUNNING = 'RUNNING',
    FINISHED = 'FINISHED',
}

export const enum PLAYER_TYPE {
    TS = 'TS',
    RUST = 'RS',
}

export const COLORS: Color[] = [
    {name: 'aliceblue', code: '#f0f8ff'},
    {name: 'antiquewhite', code: '#faebd7'},
    {name: 'aqua', code: '#00ffff'},
    {name: 'aquamarine', code: '#7fffd4'},
    {name: 'beige', code: '#f5f5dc'},
    {name: 'bisque', code: '#ffe4c4'},
    {name: 'blanchedalmond', code: '#ffebcd'},
    {name: 'blue', code: '#0000ff'},
    {name: 'blueviolet', code: '#8a2be2'},
    {name: 'brown', code: '#a52a2a'},
    {name: 'burlywood', code: '#deb887'},
    {name: 'cadetblue', code: '#5f9ea0'},
    {name: 'chartreuse', code: '#7fff00'},
    {name: 'chocolate', code: '#d2691e'},
    {name: 'coral', code: '#ff7f50'},
    {name: 'cornflowerblue', code: '#6495ed'},
    {name: 'cornsilk', code: '#fff8dc'},
    {name: 'crimson', code: '#dc143c'},
    {name: 'cyan', code: '#00ffff'},
    {name: 'darkcyan', code: '#008b8b'},
    {name: 'darkgoldenrod', code: '#b8860b'},
    {name: 'darkgray', code: '#a9a9a9'},
    {name: 'darkgreen', code: '#006400'},
    {name: 'darkkhaki', code: '#bdb76b'},
    {name: 'darkmagenta', code: '#8b008b'},
    {name: 'darkolivegreen', code: '#556b2f'},
    {name: 'darkorange', code: '#ff8c00'},
    {name: 'darkorchid', code: '#9932cc'},
    {name: 'darkred', code: '#8b0000'},
    {name: 'darksalmon', code: '#e9967a'},
    {name: 'darkseagreen', code: '#8fbc8f'},
    {name: 'darkturquoise', code: '#00ced1'},
    {name: 'darkviolet', code: '#9400d3'},
    {name: 'deeppink', code: '#ff1493'},
    {name: 'deepskyblue', code: '#00bfff'},
    {name: 'dimgray', code: '#696969'},
    {name: 'dodgerblue', code: '#1e90ff'},
    {name: 'firebrick', code: '#b22222'},
    {name: 'floralwhite', code: '#fffaf0'},
    {name: 'forestgreen', code: '#228b22'},
    {name: 'fuchsia', code: '#ff00ff'},
    {name: 'gainsboro', code: '#dcdcdc'},
    {name: 'ghostwhite', code: '#f8f8ff'},
    {name: 'gold', code: '#ffd700'},
    {name: 'goldenrod', code: '#daa520'},
    {name: 'gray', code: '#808080'},
    {name: 'green', code: '#008000'},
    {name: 'greenyellow', code: '#adff2f'},
    {name: 'honeydew', code: '#f0fff0'},
    {name: 'hotpink', code: '#ff69b4'},
    {name: 'indianred', code: '#cd5c5c'},
    {name: 'ivory', code: '#fffff0'},
    {name: 'khaki', code: '#f0e68c'},
    {name: 'lavender', code: '#e6e6fa'},
    {name: 'lavenderblush', code: '#fff0f5'},
    {name: 'lawngreen', code: '#7cfc00'},
    {name: 'lemonchiffon', code: '#fffacd'},
    {name: 'lightblue', code: '#add8e6'},
    {name: 'lightcoral', code: '#f08080'},
    {name: 'lightcyan', code: '#e0ffff'},
    {name: 'lightgoldenrodyellow', code: '#fafad2'},
    {name: 'lightgrey', code: '#d3d3d3'},
    {name: 'lightgreen', code: '#90ee90'},
    {name: 'lightpink', code: '#ffb6c1'},
    {name: 'lightsalmon', code: '#ffa07a'},
    {name: 'lightseagreen', code: '#20b2aa'},
    {name: 'lightskyblue', code: '#87cefa'},
    {name: 'lightslategray', code: '#778899'},
    {name: 'lightsteelblue', code: '#b0c4de'},
    {name: 'lightyellow', code: '#ffffe0'},
    {name: 'lime', code: '#00ff00'},
    {name: 'limegreen', code: '#32cd32'},
    {name: 'linen', code: '#faf0e6'},
    {name: 'magenta', code: '#ff00ff'},
    {name: 'maroon', code: '#800000'},
    {name: 'mediumaquamarine', code: '#66cdaa'},
    {name: 'mediumblue', code: '#0000cd'},
    {name: 'mediumorchid', code: '#ba55d3'},
    {name: 'mediumpurple', code: '#9370d8'},
    {name: 'mediumseagreen', code: '#3cb371'},
    {name: 'mediumslateblue', code: '#7b68ee'},
    {name: 'mediumspringgreen', code: '#00fa9a'},
    {name: 'mediumturquoise', code: '#48d1cc'},
    {name: 'mediumvioletred', code: '#c71585'},
    {name: 'mintcream', code: '#f5fffa'},
    {name: 'mistyrose', code: '#ffe4e1'},
    {name: 'moccasin', code: '#ffe4b5'},
    {name: 'navajowhite', code: '#ffdead'},
    {name: 'oldlace', code: '#fdf5e6'},
    {name: 'olive', code: '#808000'},
    {name: 'olivedrab', code: '#6b8e23'},
    {name: 'orange', code: '#ffa500'},
    {name: 'orangered', code: '#ff4500'},
    {name: 'orchid', code: '#da70d6'},
    {name: 'palegoldenrod', code: '#eee8aa'},
    {name: 'palegreen', code: '#98fb98'},
    {name: 'paleturquoise', code: '#afeeee'},
    {name: 'palevioletred', code: '#d87093'},
    {name: 'papayawhip', code: '#ffefd5'},
    {name: 'peachpuff', code: '#ffdab9'},
    {name: 'peru', code: '#cd853f'},
    {name: 'pink', code: '#ffc0cb'},
    {name: 'plum', code: '#dda0dd'},
    {name: 'powderblue', code: '#b0e0e6'},
    {name: 'purple', code: '#800080'},
    {name: 'rebeccapurple', code: '#663399'},
    {name: 'red', code: '#ff0000'},
    {name: 'rosybrown', code: '#bc8f8f'},
    {name: 'royalblue', code: '#4169e1'},
    {name: 'saddlebrown', code: '#8b4513'},
    {name: 'salmon', code: '#fa8072'},
    {name: 'sandybrown', code: '#f4a460'},
    {name: 'seagreen', code: '#2e8b57'},
    {name: 'seashell', code: '#fff5ee'},
    {name: 'sienna', code: '#a0522d'},
    {name: 'silver', code: '#c0c0c0'},
    {name: 'skyblue', code: '#87ceeb'},
    {name: 'slateblue', code: '#6a5acd'},
    {name: 'slategray', code: '#708090'},
    {name: 'snow', code: '#fffafa'},
    {name: 'springgreen', code: '#00ff7f'},
    {name: 'steelblue', code: '#4682b4'},
    {name: 'tan', code: '#d2b48c'},
    {name: 'teal', code: '#008080'},
    {name: 'thistle', code: '#d8bfd8'},
    {name: 'tomato', code: '#ff6347'},
    {name: 'turquoise', code: '#40e0d0'},
    {name: 'violet', code: '#ee82ee'},
    {name: 'wheat', code: '#f5deb3'},
    {name: 'white', code: '#ffffff'},
    {name: 'yellow', code: '#ffff00'},
    {name: 'yellowgreen', code: '#9acd32'},
];

export const NAMES: string[] = [
    'Darth Krayt',
    'Dengar',
    'Zam Wesell',
    'Brakiss',
    'Orn Free Taa',
    'Natasi Daala',
    'Kylo Ren',
    'Galen Marek',
    'Owen Lars',
    'Satele Shan',
    'General Grievous',
    'General Veers',
    'Clone Commander Cody',
    'Aurra Sing',
    'Kanan Jarrus',
    'Cade Skywalker',
    'Wicket',
    'Obi-Wan Kenobi',
    'Emperor Palpatine',
    'Darth Bane',
    'Beru Lars',
    'Princess Leia',
    'Aayla Secura',
    'Durge',
    'Ki-Adi-Mundi',
    'Wedge Antilles',
    'Zeb Orrelios',
    'Chewbacca',
    'Callista Ming',
    'Han Solo',
    'Mace Windu',
    'Zayne Carrick',
    'Admiral Piett',
    'Gardulla the Hutt',
    'Lord Kaan',
    'Admiral Motti',
    'Plo Koon',
    'Luminara Unduli',
    'Hera Syndulla',
    'Shaak Ti',
    'Jango Fett',
    'Qui-Gon Jinn',
    'Even Piell',
    'Sabine Wren',
    'Talon Karrde',
    'Jerec',
    'Captain Rex',
    'Rey',
    'Cad Bane',
    'Darth Maul',
    'C-3PO',
    'Greedo',
    'Prince Xizor',
    'Zuckuss',
    'Darth Nihilus',
    'Nom Anor',
    'Jarael',
    'BB-8',
    'Captain Gregar Typho',
    'Ben Skywalker',
    'General Dodonna',
    'Captain Phasma',
    'Luke Skywalker',
    'Chopper',
    'Jaina Solo',
    'General Crix Madine',
    'Anakin Solo',
    'Quinlan Vos',
    'Carnor Jax',
    'Rahm Kota',
    'Darth Plagueis',
    'Biggs Darklighter',
    'Saesee Tiin',
    'Jek Porkins',
    'Ezra Bridger',
    'Barriss Offee',
    'Jabba The Hutt',
    'Savage Opress',
    'Kit Fisto',
    'Count Dooku',
    'Mara Jade',
    'Darth Vader',
    'Jacen Solo',
    'Nute Gunray',
    'Exar Kun',
    'Adi Gallia',
    'Watto',
    'Mother Talzin',
    'Bib Fortuna',
    'Gilad Pellaeon',
    'Rune Haako',
    'Durga The Hutt',
    'Wat Tambor',
    'Clone Commander Gree',
    'Bossk',
    'Shmi Skywalker',
    'IG 88',
    'Asajj Ventress',
    'Mission Vao',
    'Lumiya',
    'Poe Dameron',
    'Boba Fett',
    'Yoda',
    'Kir Kanos',
    'Admiral Ackbar',
    'Admiral Thrawn',
    'Revan',
    'Visas Marr',
    'Kyp Durron',
    'Sebulba',
    'Senator Bail Organa',
    'Kyle Katarn',
    'Darth Malgus',
    'Ulic Qel-Droma',
    'Yaddle',
    'Mon Mothma',
    'Padm\u00e9 Amidala',
    'Grand Moff Tarkin',
    'Bastila Shan',
    'Pre Vizsla',
    'Clone Commander Bly',
    'R2-D2',
    'Dash Rendar',
    'Joruus C\'Baoth',
    'Ahsoka Tano',
    '4-LOM',
    'Lando Calrissian',
];