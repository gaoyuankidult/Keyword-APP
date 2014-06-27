"""
This class deals with way of getting information from different sources
Currently, it includes getting information from 
1. name of all researchers paper
2. 70k abstracts of paper from arxiv
"""

from __future__ import division
from lxml import etree
from os import path
from sklearn.feature_extraction.text import CountVectorizer
from nltk.corpus import stopwords
from nltk import word_tokenize
from mysql_messager import MysqlMessager 

import functools
import operator
import nltk
import string
import pickle

def isPunct(word):
  return len(word) == 1 and word in string.punctuation

def isNumeric(word):
  try:
    float(word) if '.' in word else int(word)
    return True
  except ValueError:
    return False



def listify(f):
    @functools.wraps(f)
    def listify_helper(*args, **kwargs):
        return list(f(*args, **kwargs))
    return listify_helper

class PhraseExtractor():
    def __init__(self):
        self.lemmatizer = nltk.WordNetLemmatizer()
        self.stemmer = nltk.stem.porter.PorterStemmer()
    def leaves(self, tree):
        """Finds NP (nounphrase) leaf nodes of a chunk tree."""
        for subtree in tree.subtrees(filter = lambda t: t.node=='NP'):
            yield subtree.leaves()
     
    def normalise(self,word):
        """Normalises words to lowercase and stems and lemmatizes it."""
        word = word.lower()
        #word = self.stemmer.stem_word(word)
        #word = self.lemmatizer.lemmatize(word)
        return word
     
    def acceptable_word(self,word):
        """Checks conditions for acceptable word: length, stopword."""
        accepted = bool(2 <= len(word) <= 40
            and word.lower() not in self.stopwords)
        return accepted
     
     
    def get_terms(self,tree):
        for leaf in self.leaves(tree):
            term = [ self.normalise(w) for w,t in leaf if self.acceptable_word(w) ]
            yield term    
    def extract(self, text):
 
        # Used when tokenizing words
        sentence_re = r'''(?x)      # set flag to allow verbose regexps
              ([A-Z])(\.[A-Z])+\.?  # abbreviations, e.g. U.S.A.
            | \w+(-\w+)*            # words with optional internal hyphens
            | \$?\d+(\.\d+)?%?      # currency and percentages, e.g. $12.40, 82%
            | \.\.\.                # ellipsis
            | [][.,;"'?():-_`]      # these are separate tokensconverseur
        '''

        #Taken from Su Nam Kim Paper...
        grammar = r"""
            NBAR:
                {<NN.*|JJ>*<NN.*>}  # Nouns and Adjectives, terminated with Nouns
                
            NP:
                {<NBAR>}
                {<NBAR><IN><NBAR>}  # Above, connected with in/of/etc...
        """
        chunker = nltk.RegexpParser(grammar)
         
        toks = nltk.regexp_tokenize(text, sentence_re)
        postoks = nltk.tag.pos_tag(toks)
        tree = chunker.parse(postoks)
         
        from nltk.corpus import stopwords
        self.stopwords = stopwords.words('english')
         
        terms = self.get_terms(tree)
        return terms
            
class KeywordSelector():
    """
    Class name: KeywordExtractor
    This class is in charge of selecting which word should be selected in a phrase
    """
    def __init__(self):
        pass
    def analyze(self, words):
        pass
    def _norm_nalyze(self, words):
        phrase = []        
        phrase_list = []
        for word in words:
            if word == "|" or isPunct(word):
                if len(phrase) > 0:
                    phrase_list.append(phrase)
                    phrase = []
            else:
                phrase.append(word)
        return phrase_list
        

class RakeKeywordExtractor():
  def __init__(self):
    self.stopwords = set(nltk.corpus.stopwords.words())
    self.top_fraction = 1 # consider top third candidate keywords by score
    self.keyword_selecor = KeywordSelector()
  def _generate_candidate_keywords(self, sentences):
        
    for sentence in sentences:
        words = map(lambda x: "|" if x in self.stopwords else x,nltk.word_tokenize(sentence.lower()))
        phrase_list = self.keyword_selecor.analyze(words)

    return phrase_list

  def _calculate_word_scores(self, phrase_list):
    word_freq = nltk.FreqDist()
    word_degree = nltk.FreqDist()
    for phrase in phrase_list:
      degree = len(filter(lambda x: not isNumeric(x), phrase)) - 1
      for word in phrase:
        word_freq.inc(word)
        word_degree.inc(word, degree) # other words
    for word in word_freq.keys():
      word_degree[word] = word_degree[word] + word_freq[word] # itself
    # word score = deg(w) / freq(w)
    word_scores = {}
    for word in word_freq.keys():
        word_scores[word] = word_degree[word] / word_freq[word]
    return word_scores

  def _calculate_phrase_scores(self, phrase_list, word_scores):
    phrase_scores = {}
    for phrase in phrase_list:
      phrase_score = 0
      for word in phrase:
        phrase_score += word_scores[word]
      phrase_scores[" ".join(phrase)] = phrase_score
    return phrase_scores
    
  def extract(self, text, incl_scores=False):
    sentences = nltk.sent_tokenize(text)
    phrase_list = self._generate_candidate_keywords(sentences)
    word_scores = self._calculate_word_scores(phrase_list)
    phrase_scores = self._calculate_phrase_scores(
      phrase_list, word_scores)
    sorted_phrase_scores = sorted(phrase_scores.iteritems(),
      key=operator.itemgetter(1), reverse=True)
    n_phrases = len(sorted_phrase_scores)
    if incl_scores:
      return sorted_phrase_scores[0:int(n_phrases/self.top_fraction)]
    else:
      return map(lambda x: x[0],
                 sorted_phrase_scores[0:int(n_phrases/self.top_fraction)])


class KeywordExtractor():

    def __init__(self,file_name = None,line_number = None):
        """
        @param self a point of class
        @param line_number number of lines to be processed as batch 
        """
        if file_name is None:
            self._file_name = "/home/fs/yuangao/Desktop/matching_system/src_html/handlers/articles_70k.xml"
        else:
            self._file_name = file_name
        self._mm = MysqlMessager()

        
    def get_from_abstracts(self):
        """
        This funciton reads name of paper from database. and return all the words that belongs to one auther in a list
        @param self: Pointer to class
        @return a term frequency matrix
        """

        self._mm.excute_sql(sql)
        row_iter = self._mm.fetch()
        corpus = []
        # following loop first counts
        old_auther_ID = -1
        current_auther_ID = 0
        auther_count = 0
        for row in row_iter:
            old_auther_ID = current_auther_ID
            first_name = row[0].lstrip().decode('latin1')
            last_name = row[1].lstrip().decode('latin1') 
            paper_name = row[2].lstrip().decode('latin1') 
            current_auther_ID = row[3]
            if current_auther_ID  == old_auther_ID:
                corpus[auther_count -1] = corpus[auther_count -1]+ " " + paper_name
            else:
                auther_count = auther_count +1
                corpus.append(paper_name)
                vectorizer = CountVectorizer()        
            # tfm : term frequency matrix

        tfm = vectorizer.fit_transform(corpus).toarray()              
        return tfm    

    def get_from_paper_name(self):
        """
        This funciton reads name of paper from database. and return all the words that belongs to one auther in a list
        @param self: Pointer to class
        @return a term frequency matrix
        """
        sql = "select Persons.FirstName, Persons.LastName, PaperNames.PaperName, PaperNames.P_ID from PaperNames , Persons where PaperNames.P_ID = Persons.ID;"
        self._mm.excute_sql(sql)
        row_iter = self._mm.fetch()
        corpus = []
        # following loop first counts
        old_auther_ID = -1
        current_auther_ID = 0
        auther_count = 0
        for row in row_iter:
            old_auther_ID = current_auther_ID
            first_name = row[0].lstrip().decode('latin1')
            last_name = row[1].lstrip().decode('latin1') 
            paper_name = row[2].lstrip().decode('latin1') 
            current_auther_ID = row[3]
            if current_auther_ID  == old_auther_ID:
                corpus[auther_count -1] = corpus[auther_count -1]+ " " + paper_name
            else:
                auther_count = auther_count +1
                corpus.append(paper_name)
                vectorizer = CountVectorizer()        

            
        tfm = vectorizer.fit_transform(corpus).toarray()              
        return tfm    
    def get_corpus_2000(self):
        self._corpus_keyword_filename = "handlers/corpus_keywords_70k_2000.txt"
        with open(self._corpus_keyword_filename,'r') as f_corpus_obj:
            return pickle.load(f_corpus_obj)
    def get_corpus(self, number_of_corpus, file_name = None):
        """
        This funciton reads name of paper from database. and return all the words that belongs to one auther in a list
        @param self: Pointer to class
        @return a term frequency matrix
        """
        corpus = []
        keyword_set = set()
        if file_name is None:
          file_name = self._file_name
          tree = etree.parse(file_name)
          root = tree.getroot()

        for article in root.iterchildren():
            for element in article.iterchildren():
                if element.tag == "abstract":
                    abstract = element.text
                    corpus.append(abstract)
            if(len(corpus)  == number_of_corpus):
                break
        return corpus
        
    def get_from_arxiv(self,file_name = None):
        """
        This funciton reads name of paper from database. and return all the words that belongs to one auther in a list
        @param self: Pointer to class
        @return a term frequency matrix
        """
        keyword_set = set()
        if file_name is None:
          file_name = self._file_name
          tree = etree.parse(file_name)
          root = tree.getroot()
        self._keywords_filename = "keywords_70k.txt"
        if not path.isfile(self._keywords_filename):
            f_obj = open(self._keywords_filename,'wb')
            for article in root.iterchildren():
                for element in article.iterchildren():
                    if element.tag == "abstract":
                        abstract = element.text
                        phase_extractor = PhraseExtractor()
                        keywords = list(phase_extractor.extract(abstract))
                        keywords = [' '.join(sublist) for sublist in keywords]
                        keyword_set |= set(keywords) 
            pickle.dump(keyword_set,f_obj) 
            f_obj.close()                  
        sql = ""
        self._mm.excute_sql(sql)
        row_iter = self._mm.fetch()           
        for keyword in keyword_set:
            pass
    def get_from_arxiv_num(self,number_of_corpuses, file_name = None):
        """
        This funciton reads name of paper from database. and return all the words that belongs to one auther in a list
        @param self: Pointer to class
        @return a term frequency matrix
        """

        if file_name is None:
          file_name = self._file_name
          tree = etree.parse(file_name)
          root = tree.getroot()
        self._keywords_filename = "abstract_%s.txt"%number_of_corpuses
        self._corpus_keyword_filename = "corpus_abstract_%s.txt"%number_of_corpuses
        
        if not path.isfile(self._keywords_filename):
            keyword_set = set()
            corpuses_representation_list = []
            f_obj = open(self._keywords_filename,'w')
            f_corpus_obj = open(self._corpus_keyword_filename,'w')
            i = 0
            phase_extractor = PhraseExtractor()
            for article in root.iterchildren():
                for element in article.iterchildren():
                    if element.tag == "abstract":
                        abstract = element.text

                        keywords = list(phase_extractor.extract(abstract))
                        keywords = [' '.join(sublist) for sublist in keywords]
                        corpuses_representation_list.append(','.join(keywords))

                        keyword_set |= set(keywords) 
                        i = i +1
                if(i == number_of_corpuses):
                    break
            pickle.dump(corpuses_representation_list, f_corpus_obj)
            pickle.dump(keyword_set,f_obj) 
            f_obj.close()                  
            f_corpus_obj.close()
            
            
    def get_from_arxiv_bag_of_word_model(self,file_name = None):
        """
        This funciton reads name of paper from database. and return all the words that belongs to one auther in a list
        @param self: Pointer to class
        @return a term frequency matrix
        """
        keyword_set = set()
        if file_name is None:
          file_name = self._file_name
          tree = etree.parse(file_name)
          root = tree.getroot()
        self._keywords_filename = "bag_of_words_keywords_70k_extract_from_number.txt"
        if not path.isfile(self._keywords_filename):
            f_obj = open(self._keywords_filename,'wb')
            i = 0
            for article in root.iterchildren():
                for element in article.iterchildren():
                    if element.tag == "abstract":
                        abstract = element.text
                        filtered_words = [w for w in word_tokenize(abstract) if not w in stopwords.words('english')]
                        keyword_set |= set(filtered_words)
                        i = i +1
                if(i > 1999):
                    break
            pickle.dump(keyword_set,f_obj) 
            f_obj.close()                  
        sql = ""
        self._mm.excute_sql(sql)
        row_iter = self._mm.fetch()           
        for keyword in keyword_set:
            pass            
            
        
    def filter(self):
        with open(self._keywords_filename,'r') as f:
            keywords_set = pickle.load(f)
 
if __name__ == "__main__":
    keyword_extractor = KeywordExtractor("abstracts.xml",4)
    keyword_extractor.get_from_arxiv_num(109)
    
        
