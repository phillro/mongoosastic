/**
 * User: philliprosen
 * Date: 4/2/12
 * Time: 4:19 PM
 */


var TwitterClient = require('ntwitter');
var conf = require('../etc/conf.js').development
logger = conf.logger
var mongoose = require('mongoose')
var async = require('async')
var csv = require('csv');
var mediaAmpDbConnectionString = 'mongodb://' + conf.mongo.user + ':' + conf.mongo.password + '@' + conf.mongo.host + ':' + conf.mongo.port + '/' + conf.mongo.dbName
var mediaAmpDb = mongoose.createConnection(mediaAmpDbConnectionString);
var MediaAmpModels = require('mediaamp-models/index.js')
var Tweeter = mediaAmpDb.model('tweeter', MediaAmpModels.TweeterSchema)

//Maximum of 100 users per lookup showUser API call
var maxTermsPerRequest = 100


var cli = require('cli')

cli.parse({
    verbose:['v', 'Print response']
});


var twit = new TwitterClient({
    consumer_key:conf.twitter.consumer_key,
    consumer_secret:conf.twitter.consumer_secret,
    access_token_key:conf.twitter.access_token,
    access_token_secret:conf.twitter.access_token_secret
})

var iansFriends = [300362375, 80928773, 376234071, 21696279, 35733687, 67325700, 65466158, 36361027, 358377682, 26538229, 97359375, 164086916, 56228012, 27744185, 325100194, 455869389, 508408285, 15864446, 500042487, 356288997, 159131559, 13524182, 16553792, 32290293, 317214022, 41988894, 59351766, 56633, 120687853, 807913, 14096763, 97334517, 18706675, 28435775, 487000527, 140118545, 41169389, 68739089, 40927797, 15827041, 34499890, 139819194, 24595284, 14202246, 114599241, 25029081, 15243834, 3135241, 135575282, 22429979, 454423088, 19049987, 27707080, 17498747, 33978449, 16892243, 18851698, 27806814, 7997312, 199812125, 65784286, 26396597, 128636386, 259356886, 14095178, 223375448, 315207065, 26957009, 103620256, 451586190, 18309948, 22883726, 15678837, 18740765, 429913172, 23794900, 14412533, 13363202, 31123305, 14061598, 88313781, 22193361, 74904598, 55660131, 124691908, 74905098, 70067382, 48847011, 373715533, 30345764, 119372054, 285046266, 267239714, 163561118, 139986343, 18136130, 16927360, 163594382, 213356101, 16228398, 197049152, 250969300, 389386065, 34713362, 137458918, 28407974, 23448386, 226190031, 27637730, 107146095, 16619928, 111622368, 365097521, 149913262, 7059772, 19637303, 272161214, 16017475, 196168350, 28587919, 388555493, 17024991, 26291588, 53606937, 16307039, 23478416, 387972231, 128385995, 27328805, 283734762, 13251542, 17391971, 24002724, 363450850, 14827129, 15788716, 185340210, 30261067, 57100687, 74594552, 20713061, 18791763, 50055701, 19071682, 18906561, 24895130, 337713682, 193918516, 234521957, 22141959, 26035287, 8936082, 163996680, 23087563, 29017307, 22522178, 27902825, 18917882, 57760430, 20402945, 56472469, 14836197, 278414783, 52868514, 256467247, 344258333, 90484508, 31187903, 91478624, 321583618, 263342687, 15066760, 352523567, 22334978, 2946711, 229412585, 16241563, 56413858, 54900089, 270692259, 237764259, 13299972, 16334857, 132235973, 77268813, 1717291, 28167086, 24110546, 327484803, 25276287, 20687745, 17060573, 14514804, 17893558, 16032925, 1797991, 50486210, 249351273, 23359503, 21334179, 16246929, 428333, 176644153, 1367531, 238319766, 10077242, 250172149, 151140821, 298158534, 8287602, 247153862, 26988078, 109992111, 307081204, 19803365, 17622474, 42710195, 18949452, 142776577, 18099859, 14075928, 18856867, 16670935, 18130749, 230119959, 23755112, 14425872, 14115912, 172050552, 284054633, 14669951, 21312378, 23116280, 249264158, 36555747, 51462013, 809760, 15738599, 102459037, 14940354, 49637104, 193030139, 28137012, 74754452, 156132825, 41204528, 259379883, 224550619, 229858277, 251292527, 39796874, 20833944, 214214929, 27065876, 61277941, 22922759, 143476855, 209021087, 14289197, 246481013, 90683869, 66879499, 126028635, 16912224, 18358503, 242507815, 26257166, 22872606, 92296982, 11586332, 64536128, 13471032, 17076218, 120207603, 228209340, 24459544, 25021555, 28148830, 14446007, 145393448, 14120215, 215907815, 140537017, 103939712, 17473062, 18948541, 158414847, 130532136, 57332349, 6730222, 7363172, 36870095, 23428171, 15976697, 36082429, 154555588, 135719546, 34554134, 10888212, 17513705, 14885860, 41164541, 65493023, 21222282, 43400085, 13566872, 6017542, 29343904, 5746452, 15163956, 5988062, 67085251, 29964675, 26769653, 17698956, 158539027, 133675499, 20046843, 12738522, 62832218, 30995507, 143560650, 15863293, 14050939, 16145875, 81392690, 15836769, 130160106, 21907474, 21799116, 15704666, 18267597, 13565472, 14238327, 33792634, 19406070, 3108351, 85327102, 97500989, 2511641, 1000591, 36359894, 8320022, 816653, 15164565, 14640136, 17469289, 16955517, 76511168, 16399949, 16666471, 19310266, 14313400, 14079714, 18858395, 63731505, 29198137, 62581962, 5000441, 32682137, 31121662, 36559928, 41691704, 42874095, 36366695, 10796332, 7495502, 45847620, 38681763, 7181842, 8391462, 28562317, 16511533, 18631784, 16358661, 20753328];
var robsFriends = [19094625, 22843337, 21810002, 472968071, 37967691, 383207452, 145703415, 227755413, 17758878, 387261041, 532295991, 351775423, 420533304, 1183041, 469194846, 250969300, 75097340, 460005853, 109222799, 290988850, 142832640, 97334517, 2065521, 21518612, 137404412, 223402004, 14844272, 398882157, 423411782, 217284148, 18973355, 29526703, 7847192, 472591551, 348977450, 461294085, 259465679, 170424259, 143105781, 139819194, 136004952, 254218516, 296157077, 321846046, 50454809, 116068033, 278684258, 9579652, 25187182, 265331005, 168828976, 212393889, 226687478, 371883049, 95507577, 256655573, 22812734, 17826208, 122216533, 324984034, 25338160, 18446115, 13045342, 19062153, 15985111, 18502842, 29452472, 19811190, 85590185, 14856056, 76291358, 330196261, 40202517, 358953123, 17872447, 51241574, 219580220, 15137359, 310402731, 418991627, 18706675, 356687772, 10257602, 126085203, 17972627, 16833653, 44734228, 250760205, 426464754, 132915975, 190596622, 237320454, 17790274, 14801863, 407347022, 245304936, 62774865, 20230811, 26445967, 66827445, 126410054, 246941871, 335207117, 326252845, 242704372, 342705072, 228706320, 322602539, 15873406, 17499355, 15109611, 112047805, 76687407, 21397917, 186732427, 76166323, 325100194, 41169389, 102385264, 304948897, 24002724, 346402547, 312752250, 52544275, 106860738, 37718217, 77781483, 14069268, 336085411, 419084104, 763699, 350255445, 17579431, 109930690, 353698449, 185270017, 394635011, 16107785, 236813900, 303976752, 370799854, 40225693, 242154581, 18978553, 253389132, 81497957, 303855276, 305073570, 12, 6385432, 47539748, 30924423, 104445607, 477854501, 13464732, 302637617, 243545094, 17748532, 197845065, 77957493, 281528958, 334777310, 103925867, 271452947, 104298598, 22396466, 155952299, 73760208, 40930480, 299783048, 284054633, 110075039, 15692273, 18822966, 55170438, 86056816, 461455238, 19387338, 20750553, 39358126, 104952689, 389803217, 23787000, 75139209, 47957440, 92489756, 187219557, 224597323, 52000483, 103594788, 377008346, 171002554, 88174963, 24083587, 16031927, 42281647, 231460980, 15871628, 220547923, 1797991, 27882000, 312036166, 366239004, 18686907, 16085865, 29451711, 65616414, 197869772, 373213624, 322870420, 1367531, 329167984, 128174162, 350377913, 122117133, 23313860, 14938517, 38053161, 17212941, 339728383, 58966831, 47909880, 300122169, 261512512, 16223317, 32628749, 9405862, 22905734, 27019150, 21669980, 26816483, 17234141, 17085087, 283734762, 29501977, 449304573, 350042055, 334926329, 220832074, 74835604, 65322179, 371803644, 104257356, 16989178, 344257167, 104342107, 306091893, 217612422, 53442132, 251379913, 14578544, 459602372, 42609957, 57420624, 38743751, 14960007, 442373802, 11635342, 168679374, 164256304, 16450697, 26184569, 32359921, 14157134, 22677427, 27637730, 45865384, 17878804, 351662373, 41516710, 263982059, 70960617, 35664799, 359953075, 49636984, 108074749, 184754459, 394268803, 97226775, 272027429, 227082774, 452269212, 451586190, 64741597, 73402979, 9500242, 352947624, 15433331, 24557808, 19048014, 30489163, 63202368, 36088922, 36058478, 410070653, 171969696, 19564105, 19196214, 182438498, 354494235, 131351549, 193746635, 169417259, 31665132, 20755032, 406431568, 280559140, 22089915, 32891404, 7554002, 32707312, 45761410, 19017675, 289485255, 40845080, 325522575, 355207658, 191190446, 350958562, 55611314, 206393099, 286654612, 136842204, 74526002, 14292717, 15731895, 366372446, 435028813, 47694175, 316348903, 47973374, 16970757, 125974973, 18502766, 49323761, 15298655, 75597841, 5867842, 138717046, 285738285, 77528520, 245208927, 236374122, 31439081, 386679917, 214055102, 40749577, 203079297, 22407018, 56443453, 76736871, 19536881, 15783589, 27869848, 11888192, 81915249, 14072950, 15427912, 361642666, 226190031, 380986160, 14280299, 223922669, 14348157, 118756393, 19400611, 384445331, 33248043, 42589787, 27427798, 29979814, 18790350, 13724562, 14054158, 18138592, 244548985, 54879118, 163458148, 19818471, 216498411, 37107991, 378903752, 93295809, 46666973, 202640554, 193466320, 205702643, 63500429, 30043148, 372460791, 335369838, 229130969, 22396478, 392685768, 29112283, 14573988, 316485110, 18393773, 307916051, 353702486, 1501471, 16145875, 22911039, 74231747, 16480987, 22026851, 348345136, 23832022, 241502518, 27707080, 20846084, 18733228, 34610263, 9279652, 393320090, 309676778, 2172, 9534522, 10191, 14834340, 374687222, 18951658, 74130577, 281093434, 279642533, 15841958, 25070893, 243318995, 18267544, 19399038, 79827261, 47346052, 18915795, 308686769, 214144951, 16343974, 75974281, 263816391, 17481415, 119078517, 41584238, 5987782, 45542386, 25542877, 125630525, 22816261, 284727959, 84176986, 341130570, 35227172, 338875694, 7495502, 118228000, 7113672, 4898501, 13058232, 12925072, 14494310, 69022849, 21907474, 19346439, 14277276, 134962359, 105786101, 16948477, 8442372, 19083264, 7889782, 389757150, 61978346, 108333392, 17841828, 21443221, 33552797, 989, 91380675, 4898091, 116076509, 53326942, 36451365, 50698730, 22449606, 21027715, 15906702, 16241563, 360739822, 40530469, 384266486, 110445334, 25777492, 46627530, 39092709, 292314792, 382685028, 170888503, 152898556, 85423396, 18719020, 19210171, 63512129, 313531066, 17544456, 41815295, 379400344, 31121662, 147674307, 253340585, 246171637, 22728078, 9202882, 13974442, 118910471, 25073877, 228526144, 14844867, 279276971, 33098821, 45114730, 19609871, 29462444, 15307742, 326120396, 22774516, 15481070, 48471268, 371796153, 356130277, 48847011, 308739573, 369911953, 193104380, 40798319, 136933861, 14802885, 14096763, 14588125, 57356422, 50633388, 17880354, 13, 73623921, 15080801, 5558552, 18858395, 206251633, 13019422, 4906211, 374294966, 258974297, 16825960, 22516489, 19637303, 29356594, 53473676, 14276189, 29369395, 27245742, 234540332, 18552362, 27479039, 47621568, 63209866, 137223549, 288980311, 23755782, 213126634, 60783724, 27721452, 369923463, 71298686, 20636215, 28263739, 373502780, 288871787, 298975992, 39879120, 283807534, 21183938, 79710995, 88697799, 31641658, 14805740, 13216782, 42823630, 123035277, 24050278, 18160106, 167169119, 70363243, 351146171, 20221159, 23359773, 21901213, 50486210, 27684101, 16451276, 176644153, 319038558, 41533440, 28587919, 21664245, 71064419, 32493647, 23120241, 100351634, 173419734, 1002351, 141758140, 7587032, 245111114, 17810705, 104667619, 29231456, 125773679, 38271276, 16598957, 14274132, 259817068, 123674947, 26223938, 21760972, 15204596, 234744365, 57947388, 205212092, 14075928, 21426423, 19976129, 21328656, 167483852, 103116060, 48473181, 50011708, 22193361, 263000823, 29556002, 122697155, 90165278, 14279799, 346040558, 21053056, 156132825, 58120509, 161048477, 14559881, 742143, 28167086, 16124965, 1832181, 48597403, 112615791, 127730834, 141453630, 290097288, 9376622, 783214, 36072985, 87265557, 21394549, 18181915, 142754319, 148529707, 60741791, 23359503, 14836197, 246941828, 187965811, 27212395, 13156662, 288976406, 17457839, 20252406, 27744185, 179245596, 19637934, 107155994, 20178144, 186668655, 92281665, 27937612, 262041062, 144003355, 17561562, 236454159, 143506878, 54070636, 200030190, 32989815, 22083, 49753604, 29475191, 242763001, 361195970, 256467247, 41377666, 211951561, 4923811, 145230762, 366513155, 146741647, 182642157, 110302086, 28049003, 325001744, 256221760, 314562185, 28605179, 189385490, 2367911, 25441019, 221377087, 50725573, 14123683, 49118678, 15138370, 15842433, 163996680, 181963580, 198693792, 51462013, 348076699, 23221109, 2011461, 17450410, 14940354, 19996524, 7608932, 110639889, 19071682, 146516713, 44164244, 20722851, 23840585, 16012783, 19292264, 188343397, 25803703, 29774968, 71607107, 43514541, 150605181, 31589482, 16284171, 15609684, 7087672, 22893466, 90484508, 18891281, 288909699, 70449178, 57197570, 14079714, 16068266, 47739450, 317214022, 18992010, 28109359, 16397306, 209949798, 40909981, 149993722, 19479195, 144040563, 340378754, 21706921, 190359726, 65466158, 15485461, 273583092, 126717954, 190639051, 114782468, 109309980, 15722535, 317587682, 210633817, 27185960, 101002059, 196721271, 2893971, 858051, 37687633, 156645676, 53330744, 132235973, 357043649, 53698190, 82447359, 90670105, 352362141, 65411128, 14136886, 11740902, 77398316, 26553086, 325205910, 18856867, 16390848, 223705830, 202696619, 15859039, 172050552, 43381418, 15112249, 17216468, 343772540, 292031206, 36444204, 23450320, 14224719, 3926861, 27105334, 76353567, 17698956, 40532389, 28366310, 18557055, 216299334, 61863570, 22546772, 39462935, 322028243, 38076046, 17919393, 93618872, 241709263, 15659909, 193858718, 18158346, 97268285, 34713362, 183318041, 246257512, 24028199, 19366296, 18576537, 9484732, 146733, 196994616, 16955517, 53834054, 3108351, 154169973, 13838562, 247153862, 59486174, 99786592, 244984401, 22680719, 57268394, 288397251, 91142297, 348480883, 19122675, 14677919, 5988062, 215728045, 170479423, 128616566, 95621123, 15446531, 15891430, 211699719, 100324523, 14073364, 202396203, 121258930, 16852229, 338558890, 108928516, 119372054, 240843175, 14250809, 76118395, 15836769, 144889430, 1113541, 14150654, 20653059, 14935798, 17561826, 711303, 21368849, 29427696, 305338235, 311086656, 16577804, 22703645, 19268706, 16861509, 14160347, 29911868, 14422642, 257860373, 8383592, 6361512, 198591028, 16334480, 202340457, 322599307, 140547998, 16164636, 15087011, 307259829, 126026177, 21192297, 14054448, 69192786, 18362460, 327484803, 23217803, 239696089, 237449602, 19278408, 301233683, 16683301, 13400562, 92540746, 91139068, 132132681, 36870095, 3661961, 186117486, 186471102, 262915519, 257998559, 16491569, 46633066, 7530552, 33966620, 33973843, 13471032, 20611338, 29866113, 37570179, 17466668, 293863053, 29198137, 250223991, 306118791, 20010599, 307905017, 16330790, 64816476, 809760, 15317676, 17356896, 191047731, 25163231, 82355541, 51495238, 50096544, 21044127, 50769180, 18280993, 14181577, 31511502, 25456478, 18233963, 36217004, 296462242, 196406798, 206276555, 15599095, 27091468, 300272128, 22184352, 53215565, 9532402, 38469445, 55602920, 171643578, 310720054, 18968528, 58646914, 27759798, 19788593, 30271982, 16377693, 60113766, 14599834, 6875072, 17614200, 32135704, 45858152, 299961010, 25928973, 99006758, 16120265, 21973078, 61779487, 23216903, 20175865, 23475078, 22523382, 26117264, 21612784, 15913, 657863, 111422855, 17682351, 243235100, 28176033, 52775149, 159967760, 253153968, 303806325, 149007417, 24463349, 14520351, 245928671, 16715670, 7101692, 17825324, 285735420, 23099894, 85176743, 16718516, 91390383, 299239299, 120943272, 39364684, 18083797, 224798839, 112846283, 79698358, 74591673, 26539097, 280386937, 263566683, 22506542, 54791458, 15935591, 1000591, 16538989, 18571332, 14935367, 27087844, 128667119, 19476830, 237880304, 25294150, 17008726, 43256811, 100249410, 4557111, 105961665, 158351911, 9565432, 36361027, 112283476, 5768872, 221425842, 92444525, 28264799, 199641162, 30995507, 100089301, 32772630, 5518262, 143560650, 17469289, 72651668, 24443284, 68739089, 154653968, 21425125, 80483637, 86158118, 60980587, 14314270, 20015903, 17168586, 14972202, 53439641, 69550478, 39371002, 87059808, 21700255, 27660910, 18361145, 80349071, 68994537, 29563906, 20525016, 103675142, 77669107, 47625578, 25123901, 20449296, 7059772, 15487945, 61342056, 14590903, 14687329, 52342885, 38490242, 16959931, 21312378, 19246382, 15225578, 6085952, 17300752, 5442012, 35009248, 20322060, 48703231, 70559141, 14140642, 24196664, 10971502, 22642788, 27081406, 1473431, 45459750, 14673355, 65784286, 17294614, 22561383, 20081033, 82457867, 18223590, 22522178, 24415019, 9777132, 14401521, 15179215, 19091173, 70950351, 36121245, 21711202, 32403365, 45728272, 40243607, 66172538, 20174611, 50429262, 83600743, 16051808, 15497480, 20282549, 60699354, 15950463, 44104395, 17836795, 23134068, 22017602, 17114752, 15976697, 47269875, 21603385, 50045966, 80571061, 79245395, 21077901, 76666746, 68483799, 16624180, 18142761, 14287270, 10168082, 17717287, 9300262, 5120691, 26267040, 52487389, 18083519, 19553409, 2704951, 28663513, 18127913, 16742053, 27274887, 30864583, 33750798, 17503180, 40878677, 5402612, 22032260, 14609388, 26792275, 21114659, 428333, 6017542, 15716039, 20967303, 11856892, 27881452, 17373996, 28350927, 29881603, 50004938, 61120062, 14935349, 22540858, 17006157, 62290422, 3754891, 6730222, 26292671, 17106880, 67376227, 67759557, 22300305, 11305742, 15237116, 27502479, 26918145, 73437696, 18534287, 17945680, 23368403, 17391971, 71876190, 22341950, 1586501, 47059142, 15959560, 21342612, 14278550, 21447198, 2200781, 17167957, 46322223, 14133912, 5898752, 19079480, 5477012, 14834640, 18997356, 22697935, 56218043, 37758226, 23699402, 27311044, 61661638, 17951924, 37203216, 818071, 65493023, 52405049, 19408986, 45727491, 47475431, 15731751, 16364399, 15456860, 13095252, 15079601, 20344933, 28123862, 42822599, 42308946, 49882202, 14708747, 33174565, 25570548, 16633037, 23101207, 39616562, 14994780, 44476716, 14070799, 30045475, 18646108, 18770485, 17454769, 44653060, 46176168, 19460396, 39546218, 15689503, 32517594, 14348594, 19029137, 10810102, 15227791, 14681605, 15485441, 22677790, 41259253, 40416155, 22461427, 50794213, 25320005, 18071459, 35076494, 33429393, 8349572, 23669783, 22722749, 7985672, 15124802, 37650941, 32764995, 25693244, 20182089, 16900850, 3829151, 18477798, 18000962, 31127446, 27783848, 18665800, 19786336, 21857709, 20151968, 7964202, 26642006, 22089053, 46704309, 12423202, 19273643, 21099562, 15357343, 15754679, 21111896, 43718300, 13475802, 2032411, 17133897, 19805496, 21010214, 37917164, 9543092, 9836582, 32903222, 44974047, 21117134, 21114359, 14529929, 14644196, 16031631, 14996680, 11435642, 18705515, 35972021, 44215023, 38746309, 8524892, 17998887, 16495091, 14914299, 14669951, 18873970, 18906561, 15935628, 14839147, 16545807, 15267559, 14499829, 19658936, 18736852, 19771248, 12329252, 16691049, 20736655, 13565472, 16444606, 7433772, 5763262, 8962882, 20707966, 17010390, 22517990, 18608514, 29100243, 690823, 7713202, 13218102, 21892521, 28576135, 10202342, 20958510, 21925468, 21425912, 20713061, 15934340, 17721338, 23568909, 14857525, 20109973, 18076957, 16644421, 18426910, 18477722, 15137329, 5724442, 22301010, 14216123, 14246001, 2730791, 25709609, 3452941, 8287602, 20629850, 19224439, 17133148, 13251542, 19988458, 7517052, 14289197, 16399949, 18020081, 1536811, 5746452, 15704666, 16998899, 14886375, 898691, 74543, 16116068, 15231163, 16988625, 14313400, 899941, 18791763, 15673780, 1285451, 13736, 3339171, 6972722, 17552673, 808752, 15661604, 6140, 2737751, 13740602, 12662472, 7179262, 14331117, 15264785, 14075994, 746323, 14456810, 8379862, 5766762, 680993, 14773319, 1338681, 14951263, 12939812, 12233442, 14173930, 14143421, 10793052, 799194, 793150, 12628652, 11415692, 9019642, 8210502, 7782442, 13053512, 14368821, 14297693, 14247343, 14192941, 14212205, 11069462, 9233842, 6751632, 793049, 6466022, 2342251, 12498082, 2333071, 13709302, 1702731, 13573932, 10671602, 5025251, 13299972, 897811, 5602942, 1408861, 6735882, 5870022, 13290882, 819764, 803847, 11862, 1717291, 807913, 2384071, 6160742, 2536711];

var maxTermsPerRequest = 100

var lookupUsersById = function (usersArray, lookupUsersCallback) {
    var requestsRequired = Math.ceil(usersArray.length / maxTermsPerRequest)
    var usersObj = []
    for (var r = 0; r < requestsRequired; r++) {
        var users = ''

        var end = (r+1)*maxTermsPerRequest < usersArray.length ? (r+1)*maxTermsPerRequest : usersArray.length
        /*for (var i = (r * maxTermsPerRequest); i < (end+(r * maxTermsPerRequest)); i++) {
         users += usersArray[i] + ","
         }*/

        var users = usersArray.slice((r * maxTermsPerRequest), end + (r * maxTermsPerRequest))
        //console.log(users)
        var requestsCompleted = 0
        //console.log(users)
        twit.showUser(users, function (err, users) {
            if (err) {
                //logger.log('error', err)
            } else {
                //for (var u = 0; u < users.length; u++) {
                usersObj = usersObj.concat(users)
            }
            requestsCompleted++
            if (requestsCompleted == requestsRequired) {
                lookupUsersCallback(usersObj)
            }
        })
    }
}

lookupUsersById(iansFriends, function (usersObj) {
    var rows = []
    for (var i = 0; i < usersObj.length; i++) {
        var row = {
            id:usersObj[i].id,
            screen_name:usersObj[i].screen_name,
            description:usersObj[i].description
        }
        rows.push(row)
    }
    csv()
        .from(rows)
        .toStream(process.stdout, {end:false})
        .on('end', function () {
   //         console.log('done')
            process.exit(0)
        })
})