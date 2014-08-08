from ..database_messager import MysqlMessager

from numpy import nan
from numpy import set_printoptions
from numpy import savetxt
from numpy import matrix
from numpy import eye
from numpy import sum as sum_matrix
from numpy import matrixlib
from numpy import zeros
from numpy import amax
from numpy import max
from numpy import where
from numpy import concatenate
from numpy.linalg import norm
from numpy import float64

from extractors import Extractors
from extractors import PhraseExtractor
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.feature_extraction.text import TfidfTransformer
from sklearn.preprocessing import normalize

class Analyzer():
    def __init__(self, all_keywords, all_corpus):
        """
        This constructer initialize the connection with mysqldatabase
        """
        set_printoptions(threshold= nan)
        self._mm = MysqlMessager()

        self._all_keywords = all_keywords
        self._X = self. calculate_X(all_keywords, all_corpus)

        self._X_row_num,   self._X_column_num = self._X.shape
        self._current_X = matrix(zeros((0, self._X_column_num)))
        self._current_y = matrix(zeros((1, 0))).T
    @property
    def _X():
        return self._X
        
    def reset_current(self):
        self._current_X = matrix(zeros((0, self._X_column_num)))
        self._current_y = matrix(zeros((1, 0))).T
        
    def articlewise_wordcounts(self):
        """
        return: articleswise word counts
        """
        return sum_matrix(self._X, axis = 0)
    def feature_matrix(self):
        return self._X
    def _linrel_sub(self, xi, w, y):
        """
        This function calculate the relevence score for each of the images.'
        @param self: Pointer to class
        @param cii: current image
        """
        c = 1.2
        a_i = xi * w
        score = [float(a_i * y), c/2*norm(a_i)]

        return score
        
    def linrel(self, cX, cy):
        """
        implementing linrel algorithm, the formulars are described in 
        paper -> "Pinview: implicit Feedback in content-based image retrieval"
        """
        assert(type(cX) == matrixlib.defmatrix.matrix)
        mu = 1.0

        w =  (cX.T * cX + mu * eye(self._current_X_column_num, dtype=float)).I * cX.T
        scores = [None] * self._X_row_num
        
        for i in xrange(0, self._X_row_num):
            scores[i] = self._linrel_sub(self._X[i, :], w, cy)
        return scores

    def calculate_X(self, keywords, corpus):
        """
        return normalized feature matrix. (which is of the form number of keywords times number of articles)
        """
        def tokenizer(s):
            return s.split(',')

        def tf_2_augmented_frequency(tfm):
            """
            This function transforms the term frequency matrix to augmented grequency matrix
            defined as in http://stackoverflow.com/questions/24731626/is-there-any-function-in-sklearn-that-implements-augmented-frequency?noredirect=1#comment38364544_24731626
            """
            return where(max(tfm, axis=0)==0, tfm, 0.5 + (0.5 * tfm * 1./max(tfm,axis=0)))
            
        vectorizer = CountVectorizer(vocabulary= keywords, tokenizer = tokenizer)  

        # tfm: term frequency matrix
        # the shape of the matrix is number of articles times number of keywords
        tfm = matrix(vectorizer.fit_transform(corpus).toarray(), dtype=float64)
        # get augmented frequency matrix
        afm = tf_2_augmented_frequency(tfm)
        
        #tfidft : term frequency inverse document frequency transformer
        tfidft = TfidfTransformer(smooth_idf = True, norm = "l2")
        #tfidfm : term frequency inverse document frequency matrix        
        tfidfm = matrix(tfidft.fit_transform(afm).toarray(), dtype=float64)
        target_matrix = tfidfm
        #print target_matrix.T
        return target_matrix.T
        
    def calculate_y(self, weights, current_X_row_num):
        y = zeros((1, current_X_row_num)).T
        for index in xrange(0, current_X_row_num):
            y[index, 0] = weights[index]
        return y
        
    def analyze(self, keywords, all_corpus, weights):
        """
        This function analyzes the relativeness of keywords according to the experiances  
        @params keywords of last time
        @params all_corpus of abstracts
        @params weights of each keywords
        """
        
        input_matrix = self.calculate_X(keywords, all_corpus)
        #print sum_matrix(input_matrix, 1)
        self._current_X_row_num, self._current_X_column_num = input_matrix.shape
        cy = self.calculate_y(weights, self._current_X_row_num)
        self._current_y = concatenate( ( self._current_y, cy) ) 
        self._current_X = concatenate( ( self._current_X, input_matrix) ) 
        
        return self.linrel(self._current_X, self._current_y)

if __name__ == "__main__":
    doc_analyzer = Analyzer()
    doc_analyzer.analyze()
    
            
            
            

