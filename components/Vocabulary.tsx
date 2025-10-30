import React, { useState, useEffect, FC, useRef } from 'react';
import { getTTSAudio } from '../services/geminiService';
import { decodeAudioData, decode } from '../utils/audioUtils';
import { BookOpenIcon, VolumeUpIcon, PlayIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

interface VocabItem {
  term: string;
  definition: {
    id: string;
    en: string;
  };
}

const vocabList: VocabItem[] = [
  { term: 'Break a leg', definition: { id: 'Cara untuk mendoakan seseorang semoga berhasil, terutama sebelum pertunjukan.', en: 'A way to wish someone good luck, especially before a performance.' } },
  { term: 'Bite the bullet', definition: { id: 'Menanggung situasi yang sulit atau tidak menyenangkan dengan berani.', en: 'To endure a difficult or unpleasant situation with courage.' } },
  { term: 'Hit the road', definition: { id: 'Pergi atau memulai perjalanan.', en: 'To leave or start a journey.' } },
  { term: 'On the ball', definition: { id: 'Menjadi waspada, kompeten, dan efisien.', en: 'To be alert, competent, and efficient.' } },
  { term: 'Spill the beans', definition: { id: 'Membocorkan rahasia.', en: 'To reveal a secret.' } },
  { term: 'Piece of cake', definition: { id: 'Sesuatu yang sangat mudah dilakukan.', en: 'Something that is very easy to do.' } },
  { term: 'Once in a blue moon', definition: { id: 'Sesuatu yang terjadi sangat jarang.', en: 'Something that happens very rarely.' } },
  { term: 'Cost an arm and a leg', definition: { id: 'Sangat mahal.', en: 'To be very expensive.' } },
  { term: 'Get cold feet', definition: { id: 'Tiba-tiba menjadi terlalu takut untuk melakukan sesuatu yang direncanakan.', en: 'To suddenly become too scared to do something you had planned.' } },
  { term: 'Cut corners', definition: { id: 'Melakukan sesuatu dengan cara termudah, seringkali mengorbankan kualitas.', en: 'To do something in the easiest way, often sacrificing quality.' } },
  { term: 'Let the cat out of the bag', definition: { id: 'Membocorkan rahasia secara tidak sengaja.', en: 'To accidentally reveal a secret.' } },
  { term: 'Hang in there', definition: { id: 'Jangan menyerah, bertahanlah.', en: "Don't give up, persevere." } },
  { term: 'Miss the boat', definition: { id: 'Kehilangan kesempatan untuk melakukan sesuatu.', en: 'To lose an opportunity to do something.' } },
  { term: 'Go the extra mile', definition: { id: 'Berusaha lebih keras untuk mencapai sesuatu.', en: 'To make an extra effort to achieve something.' } },
  { term: 'Read between the lines', definition: { id: 'Memahami makna tersembunyi atau yang tidak diucapkan.', en: 'To understand a hidden or unspoken meaning.' } },
  { term: 'The ball is in your court', definition: { id: 'Sekarang giliranmu untuk membuat keputusan.', en: "It's now your turn to make a decision." } },
  { term: 'Break the ice', definition: { id: 'Memulai percakapan untuk membuat suasana lebih santai.', en: 'To initiate a conversation to make the atmosphere more relaxed.' } },
  { term: 'Every cloud has a silver lining', definition: { id: 'Setiap situasi sulit memiliki aspek positif.', en: 'Every difficult situation has a positive aspect.' } },
  { term: 'Under the weather', definition: { id: 'Merasa tidak enak badan atau sakit.', en: 'To feel unwell or sick.' } },
  { term: 'The best of both worlds', definition: { id: 'Mendapatkan keuntungan dari dua situasi yang berbeda sekaligus.', en: 'To get the benefits of two different situations at the same time.' } },
  { term: 'Speak of the devil', definition: { id: 'Seseorang yang baru saja dibicarakan muncul.', en: 'The person who was just being talked about appears.' } },
  { term: 'See eye to eye', definition: { id: 'Setuju sepenuhnya dengan seseorang.', en: 'To agree completely with someone.' } },
  { term: 'When pigs fly', definition: { id: 'Sesuatu yang tidak akan pernah terjadi.', en: 'Something that will never happen.' } },
  { term: 'To kill two birds with one stone', definition: { id: 'Menyelesaikan dua masalah sekaligus dengan satu tindakan.', en: 'To solve two problems at once with a single action.' } },
  { term: 'A blessing in disguise', definition: { id: 'Sesuatu yang tampak buruk pada awalnya, tetapi ternyata membawa hasil yang baik.', en: 'Something that seems bad at first but turns out to have a good result.' } },
  { term: 'Call it a day', definition: { id: 'Memutuskan untuk berhenti bekerja atau melakukan aktivitas.', en: 'To decide to stop working or doing an activity.' } },
  { term: 'Let someone off the hook', definition: { id: 'Melepaskan seseorang dari tanggung jawab atau hukuman.', en: 'To release someone from responsibility or punishment.' } },
  { term: 'No pain, no gain', definition: { id: 'Harus bekerja keras untuk mendapatkan hasil.', en: 'You have to work hard to get results.' } },
  { term: 'Bite off more than you can chew', definition: { id: 'Mengambil tugas yang terlalu berat untuk diselesaikan.', en: 'To take on a task that is too big to handle.' } },
  { term: 'Get out of hand', definition: { id: 'Menjadi tidak terkendali.', en: 'To become uncontrollable.' } },
  { term: 'A dime a dozen', definition: { id: 'Sesuatu yang sangat umum dan tidak istimewa.', en: 'Something that is very common and not special.' } },
  { term: 'Beat around the bush', definition: { id: 'Berbicara berputar-putar, tidak langsung ke intinya.', en: 'To speak indirectly, not getting to the point.' } },
  { term: 'Better late than never', definition: { id: 'Lebih baik terlambat daripada tidak sama sekali.', en: 'It is better to be late than not at all.' } },
  { term: 'Curiosity killed the cat', definition: { id: 'Terlalu ingin tahu bisa membawa masalah.', en: 'Being too curious can lead to trouble.' } },
  { term: 'Don\'t count your chickens before they hatch', definition: { id: 'Jangan terlalu yakin akan sesuatu sebelum benar-benar terjadi.', en: "Don't be too sure of something before it actually happens." } },
  { term: 'Hit the nail on the head', definition: { id: 'Mengatakan atau melakukan sesuatu dengan tepat.', en: 'To say or do something exactly right.' } },
  { term: 'It\'s not rocket science', definition: { id: 'Itu tidak sulit untuk dipahami.', en: "It's not difficult to understand." } },
  { term: 'Jump on the bandwagon', definition: { id: 'Mengikuti tren atau sesuatu yang populer.', en: 'To follow a trend or something popular.' } },
  { term: 'Let sleeping dogs lie', definition: { id: 'Jangan mengungkit masalah lama yang sudah selesai.', en: "Don't bring up old problems that are already over." } },
  { term: 'Pull someone\'s leg', definition: { id: 'Bercanda dengan seseorang, mengerjai.', en: 'To joke with someone, to tease.' } },
  { term: 'Sit on the fence', definition: { id: 'Tidak mau memihak atau membuat keputusan.', en: 'To refuse to take sides or make a decision.' } },
  { term: 'Take it with a grain of salt', definition: { id: 'Jangan langsung percaya sepenuhnya.', en: "Don't believe it completely right away." } },
  { term: 'The elephant in the room', definition: { id: 'Masalah besar yang jelas ada tetapi tidak dibicarakan.', en: 'A big problem that is obvious but not being discussed.' } },
  { term: 'Your guess is as good as mine', definition: { id: 'Saya tidak tahu jawabannya.', en: "I don't know the answer." } },
  { term: 'Barking up the wrong tree', definition: { id: 'Membuat kesalahan atau tuduhan yang salah.', en: 'To make a mistake or a wrong accusation.' } },
  { term: 'Actions speak louder than words', definition: { id: 'Apa yang Anda lakukan lebih penting daripada apa yang Anda katakan.', en: 'What you do is more important than what you say.' } },
  { term: 'Add insult to injury', definition: { id: 'Memperburuk situasi yang sudah buruk.', en: 'To worsen an already bad situation.' } },
  { term: 'A picture is worth a thousand words', definition: { id: 'Lebih mudah menunjukkan sesuatu daripada menjelaskannya.', en: 'It is easier to show something than to explain it.' } },
  { term: 'Cross that bridge when you come to it', definition: { id: 'Menangani masalah saat itu terjadi, bukan sebelumnya.', en: 'To deal with a problem when it happens, not before.' } },
  { term: 'Cry over spilt milk', definition: { id: 'Mengeluh tentang kerugian dari masa lalu.', en: 'To complain about a loss from the past.' } },
  { term: 'Cut to the chase', definition: { id: 'Langsung ke intinya tanpa membuang waktu.', en: 'To get to the point without wasting time.' } },
  { term: 'Easy does it', definition: { id: 'Lakukan perlahan dan hati-hati.', en: 'Do it slowly and carefully.' } },
  { term: 'Get a taste of your own medicine', definition: { id: 'Mendapatkan perlakuan buruk yang sama seperti yang Anda berikan kepada orang lain.', en: 'To receive the same bad treatment you have given to others.' } },
  { term: 'Go down in flames', definition: { id: 'Gagal secara spektakuler.', en: 'To fail spectacularly.' } },
  { term: 'Heard it on the grapevine', definition: { id: 'Mendengar rumor dari seseorang.', en: 'To hear a rumor from someone.' } },
  { term: 'Ignorance is bliss', definition: { id: 'Lebih baik tidak tahu tentang sesuatu karena itu akan membuatmu khawatir.', en: "It's better not to know about something because it will make you worry." } },
  { term: 'It takes one to know one', definition: { id: 'Anda sama buruknya dengan orang yang Anda kritik.', en: 'You are just as bad as the person you are criticizing.' } },
  { term: 'Kill time', definition: { id: 'Melakukan sesuatu untuk mengisi waktu sambil menunggu.', en: 'To do something to fill time while waiting.' } },
  { term: 'Method to my madness', definition: { id: 'Ada tujuan di balik tindakan yang tampak aneh.', en: 'There is a purpose behind seemingly strange actions.' } },
  { term: 'Not the sharpest tool in the shed', definition: { id: 'Seseorang yang tidak terlalu pintar.', en: 'Someone who is not very smart.' } },
  { term: 'A penny for your thoughts', definition: { id: 'Apa yang sedang kamu pikirkan?', en: 'What are you thinking about?' } },
  { term: 'Back to the drawing board', definition: { id: 'Mulai lagi dari awal karena rencana sebelumnya gagal.', en: 'To start over from the beginning because the previous plan failed.' } },
  { term: 'Best thing since sliced bread', definition: { id: 'Sebuah penemuan atau ide yang sangat bagus.', en: 'A very good invention or idea.' } },
  { term: 'Burn the midnight oil', definition: { id: 'Bekerja hingga larut malam.', en: 'To work late into the night.' } },
  { term: 'Caught between a rock and a hard place', definition: { id: 'Terjebak dalam dua pilihan yang sama-sama sulit.', en: 'To be stuck between two equally difficult choices.' } },
  { term: 'Cry wolf', definition: { id: 'Meminta bantuan padahal tidak butuh, sehingga orang tidak percaya saat benar-benar butuh.', en: 'To ask for help when you don\'t need it, so people don\'t believe you when you really do.' } },
  { term: 'Don\'t give up your day job', definition: { id: 'Kamu tidak terlalu bagus dalam hal ini (sebagai lelucon).', en: "You're not very good at this (as a joke)." } },
  { term: 'Every dog has his day', definition: { id: 'Setiap orang akan mendapatkan kesempatan suksesnya.', en: 'Everyone will get their chance to succeed.' } },
  { term: 'Fit as a fiddle', definition: { id: 'Sangat sehat dan kuat.', en: 'Very healthy and strong.' } },
  { term: 'Go on a wild goose chase', definition: { id: 'Melakukan pencarian yang sia-sia.', en: 'To engage in a futile search.' } },
  { term: 'Hit the sack / hit the hay', definition: { id: 'Pergi tidur.', en: 'To go to bed.' } },
  { term: 'It\'s raining cats and dogs', definition: { id: 'Hujan sangat deras.', en: 'It is raining very heavily.' } },
  { term: 'Jump to conclusions', definition: { id: 'Membuat kesimpulan terlalu cepat tanpa fakta.', en: 'To make a conclusion too quickly without facts.' } },
  { term: 'Keep something at bay', definition: { id: 'Menjaga jarak dari sesuatu yang berbahaya.', en: 'To keep something dangerous at a distance.' } },
  { term: 'Last straw', definition: { id: 'Puncak kesabaran, masalah terakhir yang membuat seseorang marah.', en: 'The final problem that makes someone angry.' } },
];

const Vocabulary: FC = () => {
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
  const [playingTerm, setPlayingTerm] = useState<string | null>(null);
  const [loadingTerm, setLoadingTerm] = useState<string | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const { language, t } = useLanguage();

  useEffect(() => {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    setAudioContext(ctx);
    return () => {
      sourceRef.current?.stop();
      ctx.close();
    };
  }, []);

  const playAudio = async (term: string) => {
    if (!audioContext) return;

    if (sourceRef.current) {
      sourceRef.current.stop();
      sourceRef.current = null;
    }
    setPlayingTerm(null);

    if (audioContext.state === 'suspended') {
      await audioContext.resume();
    }
    
    setLoadingTerm(term);

    try {
      const base64Audio = await getTTSAudio(term);
      if (base64Audio) {
        const audioBuffer = await decodeAudioData(decode(base64Audio), audioContext, 24000, 1);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
        
        sourceRef.current = source;
        setPlayingTerm(term);

        source.onended = () => {
          if (sourceRef.current === source) {
            setPlayingTerm(null);
            sourceRef.current = null;
          }
        };
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setPlayingTerm(null);
      if (sourceRef.current) {
        sourceRef.current = null;
      }
    } finally {
        setLoadingTerm(current => (current === term ? null : current));
    }
  };

  return (
     <div className="bg-slate-800 rounded-xl shadow-lg p-6">
      <div className="flex items-center mb-6">
        <BookOpenIcon className="w-8 h-8 text-amber-400 mr-3"/>
        <div>
            <h2 className="text-2xl font-bold text-amber-400">{t('vocabularyBuilderTitle')}</h2>
            <p className="text-slate-400">{t('vocabularyBuilderDescription')}</p>
        </div>
      </div>
      <div className="space-y-3 h-[calc(100vh-12rem)] overflow-y-auto pr-2">
        {vocabList.map((item) => (
          <div key={item.term} className="flex items-center justify-between bg-slate-900/50 p-4 rounded-lg">
            <div>
              <p className="font-semibold text-white">{item.term}</p>
              <p className="text-sm text-slate-400">{item.definition[language]}</p>
            </div>
            <button
              onClick={() => playAudio(item.term)}
              disabled={loadingTerm === item.term}
              className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full bg-slate-700 hover:bg-amber-500 text-slate-300 hover:text-white transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
              aria-label={t('playPronunciation', item.term)}
            >
              {loadingTerm === item.term ? (
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
              ) : playingTerm === item.term ? (
                <VolumeUpIcon className="w-5 h-5"/>
              ) : (
                <PlayIcon className="w-5 h-5"/>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Vocabulary;
