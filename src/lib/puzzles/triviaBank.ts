import { getDailySeed, mulberry32, shuffle } from "../seed";

const decades = [1950, 1960, 1970, 1980] as const;
type Decade = typeof decades[number];
type Entry = readonly [question: string, answer: string, wrong1: string, wrong2: string, wrong3: string, fact: string];

const bank: Record<Decade, readonly Entry[]> = {
  1950: [
    ["Who had a 1956 hit with “Hound Dog”?", "Elvis Presley", "Pat Boone", "Perry Como", "Ricky Nelson", "Big Mama Thornton recorded the song before Elvis made his version."],
    ["Which musician wrote and recorded “Johnny B. Goode”?", "Chuck Berry", "Bo Diddley", "Fats Domino", "Jerry Lee Lewis", "NASA included Chuck Berry’s recording on the Voyager Golden Record."],
    ["What was the name of Buddy Holly’s band?", "The Crickets", "The Coasters", "The Platters", "The Everly Brothers", "The Crickets had a 1957 hit with “That’ll Be the Day.”"],
    ["Who recorded the original hit version of “Tutti Frutti” in 1955?", "Little Richard", "Sam Cooke", "Frankie Avalon", "Roy Orbison", "The song’s famous opening scat helped make Little Richard a rock-and-roll star."],
    ["What was the first No. 1 song on the Billboard Hot 100 in 1958?", "“Poor Little Fool”", "“Hound Dog”", "“Blueberry Hill”", "“La Bamba”", "Ricky Nelson sang “Poor Little Fool” and was also a regular on his family’s TV show."],
    ["Who sang the 1956 country hit “I Walk the Line”?", "Johnny Cash", "Hank Williams", "Patsy Cline", "Jim Reeves", "Johnny Cash released the song through Sun Records, the Memphis label that also recorded Elvis."],
    ["Who played Lucy Ricardo on I Love Lucy?", "Lucille Ball", "Vivian Vance", "Donna Reed", "Doris Day", "Lucille Ball’s real-life husband, Desi Arnaz, played Lucy’s husband Ricky."],
    ["What did Ralph Kramden drive for a living on The Honeymooners?", "A city bus", "A taxi", "A delivery truck", "A subway train", "Jackie Gleason played the big-dreaming bus driver."],
    ["Who created and hosted the original Twilight Zone?", "Rod Serling", "Alfred Hitchcock", "Jack Webb", "Ed Sullivan", "The show premiered in 1959 and often ended with a surprise twist."],
    ["What breed of dog was Lassie in the classic television series?", "Rough collie", "Golden retriever", "German shepherd", "Irish setter", "Lassie was a fictional female dog, and the original film role was played by a male collie named Pal."],
    ["What were the young performers on The Mickey Mouse Club called?", "Mouseketeers", "Mouse Buddies", "Magic Makers", "Club Scouts", "Mouseketeers wore the show’s signature round mouse ears."],
    ["What was Beaver Cleaver’s first name on Leave It to Beaver?", "Theodore", "Walter", "Richard", "Charles", "Jerry Mathers played Theodore “Beaver” Cleaver."],
    ["Which film earned Dorothy Dandridge a Best Actress Oscar nomination?", "Carmen Jones", "Porgy and Bess", "Island in the Sun", "Bright Road", "She became the first Black woman nominated for the Academy Award for Best Actress."],
    ["Who danced in the rain in the title number of Singin’ in the Rain?", "Gene Kelly", "Fred Astaire", "Donald O’Connor", "Danny Kaye", "Gene Kelly also co-directed the 1952 movie with Stanley Donen."],
    ["Who directed the 1954 film Rear Window?", "Alfred Hitchcock", "Billy Wilder", "John Ford", "Elia Kazan", "James Stewart plays a photographer who watches his neighbors while recovering from a broken leg."],
    ["What does Cinderella leave behind in Disney’s 1950 animated film?", "A glass slipper", "A silver necklace", "A velvet glove", "A golden crown", "The slipper is the clue that eventually leads the prince back to Cinderella."],
    ["Who played Princess Ann in Roman Holiday?", "Audrey Hepburn", "Grace Kelly", "Elizabeth Taylor", "Deborah Kerr", "Audrey Hepburn won an Academy Award for the role."],
    ["Which actor played Juror No. 8 in the 1957 film 12 Angry Men?", "Henry Fonda", "Gregory Peck", "James Stewart", "Marlon Brando", "Most of the film takes place in a single jury room."],
    ["Which country launched Sputnik 1 in 1957?", "The Soviet Union", "The United States", "France", "Japan", "Sputnik 1 was the first artificial satellite to orbit Earth."],
    ["Who reached the summit of Mount Everest alongside Edmund Hillary in 1953?", "Tenzing Norgay", "Reinhold Messner", "George Mallory", "Maurice Herzog", "Hillary and Norgay made the first confirmed ascent of Everest."],
    ["Which became the 50th U.S. state in 1959?", "Hawaii", "Alaska", "Arizona", "New Mexico", "Alaska had joined earlier in 1959 as the 49th state."],
    ["Where did the first Disneyland park open in 1955?", "Anaheim, California", "Orlando, Florida", "Burbank, California", "San Diego, California", "Disneyland’s original California park opened more than 16 years before Florida’s Magic Kingdom."],
    ["Which doll debuted in 1959 wearing a black-and-white striped swimsuit?", "Barbie", "Chatty Cathy", "Raggedy Ann", "Betsy Wetsy", "Barbie debuted at the American International Toy Fair in New York City."],
    ["Who created the Peanuts comic strip, which debuted in 1950?", "Charles M. Schulz", "Chic Young", "Hank Ketcham", "Mort Walker", "Snoopy started the strip as Charlie Brown’s pet dog and later developed his own elaborate fantasies."],
    ["What plastic toy became a worldwide waist-spinning craze in 1958?", "The Hula Hoop", "The Slinky", "The Frisbee", "The yo-yo", "Wham-O’s plastic hoop helped turn an old hoop-spinning pastime into a 1950s craze."],
    ["What did children originally supply for their Mr. Potato Head pieces?", "A real potato", "A wooden ball", "A plastic bottle", "A cardboard box", "Early sets sold loose facial features to stick into a real vegetable."],
  ],
  1960: [
    ["Which American TV show featured the Beatles’ famous February 1964 performance?", "The Ed Sullivan Show", "American Bandstand", "The Tonight Show", "The Steve Allen Show", "The February broadcast introduced the Beatles to a huge American television audience."],
    ["Which 1960s Motown group included Diana Ross, Mary Wilson, and Florence Ballard?", "The Supremes", "The Ronettes", "The Shirelles", "The Marvelettes", "The group had its first Billboard Hot 100 No. 1 with “Where Did Our Love Go.”"],
    ["Who sang the 1967 hit recording of “Respect”?", "Aretha Franklin", "Dionne Warwick", "Etta James", "Dusty Springfield", "Otis Redding wrote and recorded “Respect” before Aretha Franklin’s version became an anthem."],
    ["Which band released Pet Sounds in 1966?", "The Beach Boys", "The Beatles", "The Kinks", "The Byrds", "The album opens with “Wouldn’t It Be Nice.”"],
    ["In which state did the 1969 Woodstock festival take place?", "New York", "California", "Vermont", "Massachusetts", "The festival took place on a dairy farm near Bethel, New York."],
    ["Who wrote the Monkees hit “I’m a Believer”?", "Neil Diamond", "Carole King", "Paul Simon", "Brian Wilson", "Neil Diamond also recorded his own version of the song."],
    ["What was the fictional town in The Andy Griffith Show called?", "Mayberry", "Hooterville", "Petticoat Junction", "Walnut Grove", "Andy Taylor was Mayberry’s sheriff and Barney Fife was his deputy."],
    ["Which actress played Laura Petrie on The Dick Van Dyke Show?", "Mary Tyler Moore", "Elizabeth Montgomery", "Barbara Eden", "Carol Burnett", "Mary Tyler Moore later starred in her own sitcom as a Minneapolis TV producer."],
    ["Who played Captain James T. Kirk in the original Star Trek?", "William Shatner", "Leonard Nimoy", "DeForest Kelley", "James Doohan", "Captain Kirk commanded the starship Enterprise in the original series."],
    ["Who hosted the original daytime Jeopardy! when it debuted in 1964?", "Art Fleming", "Alex Trebek", "Bob Barker", "Gene Rayburn", "Art Fleming hosted the daytime original before Alex Trebek hosted the syndicated revival."],
    ["Who was Gomez Addams’s wife on The Addams Family?", "Morticia", "Lily", "Samantha", "Jeannie", "Carolyn Jones played Morticia in the original television series."],
    ["Which actor played Batman in the live-action 1960s television series?", "Adam West", "Burt Ward", "Cesar Romero", "Burgess Meredith", "Burt Ward played Batman’s crime-fighting partner, Robin."],
    ["What item does Mary Poppins use to fly in the 1964 Disney film?", "An umbrella", "A broom", "A carpet", "A kite", "Julie Andrews won the Academy Award for Best Actress for playing Mary."],
    ["In which country is most of The Sound of Music set?", "Austria", "Switzerland", "France", "Italy", "The city of Salzburg appears in several scenes from the 1965 film."],
    ["What is the computer called in 2001: A Space Odyssey?", "HAL 9000", "Deep Blue", "WOPR", "Colossus", "HAL’s voice was provided by actor Douglas Rain."],
    ["What landmark appears in the final scene of the 1968 Planet of the Apes?", "The Statue of Liberty", "The Eiffel Tower", "The Golden Gate Bridge", "The Washington Monument", "The buried landmark reveals where the astronaut’s journey actually took him."],
    ["Who became the first person to walk on the Moon in 1969?", "Neil Armstrong", "Buzz Aldrin", "Michael Collins", "John Glenn", "Buzz Aldrin joined Armstrong on the lunar surface while Michael Collins remained in orbit."],
    ["Who became the first American to orbit Earth in 1962?", "John Glenn", "Alan Shepard", "Scott Carpenter", "Gus Grissom", "Glenn orbited Earth three times aboard Friendship 7."],
    ["Which president said “Ask not what your country can do for you” in his inaugural address?", "John F. Kennedy", "Dwight D. Eisenhower", "Lyndon B. Johnson", "Richard Nixon", "The speech took place at the U.S. Capitol in January 1961."],
    ["Who signed the U.S. Civil Rights Act of 1964 into law?", "Lyndon B. Johnson", "John F. Kennedy", "Richard Nixon", "Harry Truman", "The act banned racial segregation in many public accommodations."],
    ["Where did Martin Luther King Jr. deliver his “I Have a Dream” speech in 1963?", "The Lincoln Memorial", "The U.S. Capitol", "The White House", "The Jefferson Memorial", "The speech was part of the March on Washington for Jobs and Freedom."],
    ["Which children’s television series debuted in 1969 with Big Bird?", "Sesame Street", "Mister Rogers’ Neighborhood", "Captain Kangaroo", "The Electric Company", "The show mixed puppets, animation, and live action to teach young viewers."],
    ["Which Ford car was unveiled at the 1964 New York World’s Fair?", "Mustang", "Thunderbird", "Falcon", "Bronco", "The Mustang was marketed as a sporty car with a wide menu of options."],
    ["What drawing toy has two knobs and a red frame?", "Etch A Sketch", "Lite-Brite", "Spirograph", "Magic Slate", "Turning the toy upside down and shaking it erases the picture."],
    ["What originally supplied heat in the Easy-Bake Oven toy?", "A light bulb", "A gas flame", "Hot water", "A battery pack", "The first models used incandescent bulbs to bake miniature treats."],
    ["Which team won the first Super Bowl in January 1967?", "Green Bay Packers", "Kansas City Chiefs", "New York Jets", "Dallas Cowboys", "The Packers beat the Chiefs in Los Angeles."],
  ],
  1970: [
    ["Which song won the 1974 Eurovision Song Contest for ABBA?", "“Waterloo”", "“Dancing Queen”", "“Mamma Mia”", "“Fernando”", "ABBA represented Sweden at the contest in Brighton, England."],
    ["Which band recorded “Bohemian Rhapsody” in 1975?", "Queen", "Led Zeppelin", "Electric Light Orchestra", "Pink Floyd", "The recording moves from ballad to an operatic section and then into hard rock."],
    ["Which group sang “Stayin’ Alive” on the Saturday Night Fever soundtrack?", "Bee Gees", "KC and the Sunshine Band", "Village People", "The Jacksons", "The song plays while John Travolta’s character walks through Brooklyn in the opening sequence."],
    ["Who wrote and first recorded “Jolene”?", "Dolly Parton", "Loretta Lynn", "Tammy Wynette", "Linda Ronstadt", "Dolly Parton has said the name came from a young fan she once met."],
    ["Which band released the album Rumours in 1977?", "Fleetwood Mac", "The Eagles", "Boston", "Heart", "The album includes “Dreams,” sung and written by Stevie Nicks."],
    ["Who released Songs in the Key of Life in 1976?", "Stevie Wonder", "Marvin Gaye", "Al Green", "Lionel Richie", "The double album includes “Sir Duke,” a tribute to Duke Ellington and other musicians."],
    ["Who sang “Rocket Man,” released in 1972?", "Elton John", "David Bowie", "Billy Joel", "Paul McCartney", "Elton John composed the music and his longtime partner Bernie Taupin wrote the lyrics."],
    ["Who played the title character in Annie Hall?", "Diane Keaton", "Faye Dunaway", "Jane Fonda", "Sally Field", "Diane Keaton won the Best Actress Oscar for the role."],
    ["Who provided Darth Vader’s voice in the original 1977 Star Wars?", "James Earl Jones", "Alec Guinness", "Mark Hamill", "Harrison Ford", "Actor David Prowse wore the Vader costume for most of the character’s scenes."],
    ["In which city does Rocky run up the museum steps?", "Philadelphia", "Chicago", "New York City", "Boston", "The steps lead to the Philadelphia Museum of Art."],
    ["Who directed the 1975 film Jaws?", "Steven Spielberg", "George Lucas", "Francis Ford Coppola", "Martin Scorsese", "Mechanical sharks were built for the film’s ocean scenes."],
    ["Who played Dr. Frank-N-Furter in The Rocky Horror Picture Show?", "Tim Curry", "Meat Loaf", "Barry Bostwick", "Richard O’Brien", "Tim Curry also played the role in the original London stage production."],
    ["Who played Sandy opposite John Travolta in Grease?", "Olivia Newton-John", "Stockard Channing", "Susan Sarandon", "Karen Carpenter", "Newton-John and Travolta sang “You’re the One That I Want” together."],
    ["Who hosted The Muppet Show within the show’s fictional theater?", "Kermit the Frog", "Miss Piggy", "Fozzie Bear", "Gonzo", "Kermit tried to keep the variety show running through the cast’s backstage mishaps."],
    ["In which city did Mary Richards work on The Mary Tyler Moore Show?", "Minneapolis", "Chicago", "Seattle", "Milwaukee", "A statue in downtown Minneapolis depicts Mary tossing her hat in the opening credits."],
    ["On which show did Henry Winkler play the Fonz?", "Happy Days", "Laverne & Shirley", "Welcome Back, Kotter", "Taxi", "The character’s full name was Arthur Fonzarelli."],
    ["During which war is the television series M*A*S*H set?", "The Korean War", "World War II", "The Vietnam War", "World War I", "M*A*S*H follows the staff of a mobile army surgical hospital."],
    ["What Minnesota town is the Ingalls family’s home in Little House on the Prairie?", "Walnut Grove", "Mayberry", "Hooterville", "Sweetwater", "The series was inspired by the books of Laura Ingalls Wilder."],
    ["Who hosted the original U.S. daytime Wheel of Fortune in 1975?", "Chuck Woolery", "Pat Sajak", "Alex Trebek", "Bob Eubanks", "Pat Sajak later took over as host of the daytime version in the early 1980s."],
    ["How many years did the U.S. Bicentennial celebrate in 1976?", "200", "100", "150", "250", "It marked two centuries since the adoption of the Declaration of Independence."],
    ["What pair of NASA probes launched in 1977 to study the outer planets?", "Voyager 1 and Voyager 2", "Viking 1 and Viking 2", "Gemini 11 and Gemini 12", "Mariner 6 and Mariner 7", "Both Voyager probes carry Golden Records containing sounds and images from Earth."],
    ["Which racehorse won the U.S. Triple Crown in 1973?", "Secretariat", "Seattle Slew", "Affirmed", "Spectacular Bid", "Secretariat won the Belmont Stakes by 31 lengths."],
    ["Which president took office after Richard Nixon resigned in 1974?", "Gerald Ford", "Jimmy Carter", "Spiro Agnew", "Ronald Reagan", "Ford had been appointed vice president before becoming president."],
    ["Which country was Rubik’s Cube inventor Ernő Rubik from?", "Hungary", "Poland", "Austria", "France", "Rubik developed the puzzle in the 1970s while teaching design."],
    ["Which company released the arcade game Pong in 1972?", "Atari", "Nintendo", "Sega", "Magnavox", "The game simulates table tennis with two paddles and a moving dot."],
    ["What did Sony’s original Walkman play when it went on sale in Japan in 1979?", "Cassette tapes", "Vinyl singles", "Compact discs", "MiniDiscs", "Its lightweight headphones made personal music listening on the move much easier."],
  ],
  1980: [
    ["Who released the 1982 album Thriller?", "Michael Jackson", "Prince", "Lionel Richie", "Stevie Wonder", "The album includes “Billie Jean,” “Beat It,” and the title track."],
    ["Which singer released “Like a Virgin” in 1984?", "Madonna", "Cyndi Lauper", "Janet Jackson", "Debbie Harry", "Nile Rodgers produced the album of the same name."],
    ["Who sang “I Wanna Dance with Somebody (Who Loves Me)”?", "Whitney Houston", "Tina Turner", "Diana Ross", "Gloria Estefan", "It was the lead single from Houston’s second studio album, Whitney."],
    ["Which artist starred in the 1984 film Purple Rain?", "Prince", "David Bowie", "Michael Jackson", "George Michael", "The film’s music earned Prince an Academy Award for Original Song Score."],
    ["What were the two main host cities for Live Aid in 1985?", "London and Philadelphia", "Los Angeles and Paris", "New York and Dublin", "Manchester and Chicago", "The concerts were organized to raise money for Ethiopian famine relief."],
    ["Who had a worldwide hit with “Girls Just Want to Have Fun”?", "Cyndi Lauper", "Madonna", "Pat Benatar", "Bonnie Tyler", "Cyndi Lauper’s version appeared on her debut album, She’s So Unusual."],
    ["Which band recorded “Livin’ on a Prayer”?", "Bon Jovi", "Journey", "Foreigner", "Def Leppard", "The chorus follows two fictional characters, Tommy and Gina."],
    ["What candy does Elliott use to lure E.T.?", "Reese’s Pieces", "M&M’s", "Skittles", "Milk Duds", "The colorful candy leads the visitor toward Elliott’s house one piece at a time."],
    ["What kind of car becomes the time machine in Back to the Future?", "A DeLorean", "A Corvette", "A Ford Mustang", "A Pontiac Firebird", "In the film the car must reach 88 miles per hour to travel through time."],
    ["What does Indiana Jones search for in Raiders of the Lost Ark?", "The Ark of the Covenant", "The Holy Grail", "A crystal skull", "A golden compass", "The film introduced Harrison Ford as archaeologist Indiana Jones."],
    ["In which city is the original Ghostbusters set?", "New York City", "Chicago", "Boston", "Los Angeles", "The Ghostbusters make an old firehouse their headquarters."],
    ["Which character in The Princess Bride is looking for the six-fingered man?", "Inigo Montoya", "Westley", "Fezzik", "Vizzini", "Mandy Patinkin played Inigo, the swordsman who seeks to avenge his father."],
    ["Where is the skyscraper in the first Die Hard set?", "Los Angeles", "New York City", "San Francisco", "Chicago", "The fictional Nakatomi Plaza was represented by Fox Plaza in Los Angeles."],
    ["Which character on The Golden Girls is Dorothy’s mother?", "Sophia", "Rose", "Blanche", "Gloria", "Estelle Getty played Sophia Petrillo."],
    ["In which city was the bar in Cheers located?", "Boston", "New York City", "Baltimore", "Providence", "The exterior used a real Boston pub on Beacon Street."],
    ["Who played the resourceful title character in the original MacGyver?", "Richard Dean Anderson", "Tom Selleck", "Don Johnson", "David Hasselhoff", "MacGyver became known for making clever use of ordinary objects."],
    ["Who hosted the original PBS series Reading Rainbow?", "LeVar Burton", "Fred Rogers", "Bob Ross", "Bill Nye", "The show encouraged children to discover books and ran for more than two decades."],
    ["Which character searches for Princess Toadstool in the original Super Mario Bros.?", "Mario", "Link", "Kirby", "Sonic", "A second player can play as Mario’s brother Luigi."],
    ["Which falling-block game came bundled with the Game Boy in North America?", "Tetris", "Dr. Mario", "Breakout", "Q*bert", "The handheld release helped introduce Tetris to a wide audience in 1989."],
    ["Which company created the original Pac-Man arcade game?", "Namco", "Atari", "Nintendo", "Sega", "Pac-Man debuted in Japanese arcades in 1980."],
    ["In what year did the Berlin Wall open?", "1989", "1984", "1986", "1987", "Crowds crossed between East and West Berlin on the night of November 9."],
    ["Who became the first American woman in space in 1983?", "Sally Ride", "Judith Resnik", "Kathryn Sullivan", "Christa McAuliffe", "Ride flew aboard the space shuttle Challenger."],
    ["Which team did the U.S. beat in the 1980 men’s Olympic hockey “Miracle on Ice”?", "The Soviet Union", "Canada", "Sweden", "Finland", "The U.S. went on to beat Finland in its final game to secure the gold medal."],
    ["What was the first Space Shuttle to fly into orbit?", "Columbia", "Challenger", "Discovery", "Atlantis", "Columbia’s first flight lifted off in April 1981."],
    ["Which computer did Apple promote in its famous “1984” Super Bowl ad?", "Macintosh", "Apple II", "Lisa", "iMac", "The first Macintosh went on sale two days after that Super Bowl."],
    ["Which soda company introduced a new formula in 1985 then brought the original back as “Classic”?", "Coca-Cola", "Pepsi", "Dr Pepper", "RC Cola", "Coca-Cola returned the original formula to shelves within three months of the change."],
  ],
};

export const triviaBankSize = decades.reduce((total, decade) => total + bank[decade].length, 0);

export type TriviaQuestion = {
  id: string;
  decade: Decade;
  question: string;
  options: string[];
  correct: number;
  fact: string;
};

export function createTrivia(date: string): TriviaQuestion[] {
  const random = mulberry32(getDailySeed("nostalgia-trivia", date));
  const choices = decades.map((decade) => shuffle(bank[decade].map((entry, index) => ({
    entry, decade, id: decade + "-" + (index + 1),
  })), random));

  return shuffle([...choices.map((entries) => entries[0]), shuffle(choices.flatMap((entries) => entries.slice(1)), random)[0]], random)
    .map(({ id, decade, entry: [question, answer, wrong1, wrong2, wrong3, fact] }) => {
      const options = shuffle([answer, wrong1, wrong2, wrong3], random);
      return { id, decade, question, options, correct: options.indexOf(answer), fact };
    });
}
