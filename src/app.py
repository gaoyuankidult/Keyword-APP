# Python imports

# Tornado imports
import pymongo
import uuid

import tornado.ioloop
import tornado.options
import tornado.web

from tornado.options import define, options
from tornado.web import url
from copy import deepcopy

from handlers.handlers import *


define("port", default=8888, type=int)
define("config_file", default="app_config.yml", help="app_config file")

#MONGO_SERVER = '192.168.1.68'
MONGO_SERVER = 'localhost'


class Application(tornado.web.Application):
    def __init__(self, **overrides):
        #self.config = self._get_config()
        handlers = [
        url(r'/', LoginHandler, name='/'),

        url(r'/form', FormHandler, name = 'form'),
        url(r'/next', NextHandler,name = 'next'),
        url(r'/index', IndexHandler, name='index'),
        url(r'/search', SearchHandler, name='search'),
        url(r'/analyzer', AnalyzerHandler, name='analyzer'),
        url(r'/email', EmailMeHandler, name='email'),
        url(r'/message', MessageHandler, name='message'),
        url(r'/grav', GravatarHandler, name='grav'),
        url(r'/menu', MenuTagsHandler, name='menu'),
        url(r'/slidy', SlidyHandler, name='slidy'),
        url(r'/notification', NotificationHandler, name='notification'),
        url(r'/fb_demo', FacebookDemoHandler, name='fb_demo'),
        url(r'/popup', PopupHandler, name='popup_demo'),
        url(r'/tail', TailHandler, name='tail_demo'),
        url(r'/pusher', DataPusherHandler, name='push_demo'),
        url(r'/pusher_raw', DataPusherRawHandler, name='push_raw_demo'),
        url(r'/matcher/([^\/]+)/', WildcardPathHandler),
        url(r'/back_to_where_you_came_from', ReferBackHandler, name='referrer'),
        url(r'/thread', ThreadHandler, name='thread_handler'),
        url(r'/s3uploader', S3PhotoUploadHandler, name='photos'),

        url(r'/login_no_block', NoneBlockingLogin, name='login_no_block'),
        url(r'/login', LoginHandler, name='login'),
        url(r'/twitter_login', TwitterLoginHandler, name='twitter_login'),
        url(r'/facebook_login', FacebookLoginHandler, name='facebook_login'),
        url(r'/register', RegisterHandler, name='register'),
        url(r'/logout', LogoutHandler, name='logout'),

        ]

        #xsrf_cookies is for XSS protection add this to all forms: {{ xsrf_form_html() }}
        settings = {
            'static_path': os.path.join(os.path.dirname(__file__), 'static'),
            'template_path': os.path.join(os.path.dirname(__file__), 'templates'),
            "cookie_secret":    base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes),
            'twitter_consumer_key': 'KEY',
            'twitter_consumer_secret': 'SECRET',
            'facebook_app_id': '180378538760459',
            'facebook_secret': '7b82b89eb6aa0d3359e2036e4d1eedf0',
            'facebook_registration_redirect_url': 'http://localhost:8888/facebook_login',
            'mandrill_key': 'KEY',
            'mandrill_url': 'https://mandrillapp.com/api/1.0/',

            'xsrf_cookies': False,
            'debug': True,
            'log_file_prefix': "tornado.log",
        }

        tornado.web.Application.__init__(self, handlers, **settings)

        self.syncconnection = pymongo.Connection(MONGO_SERVER, 27017)

        if 'db' in overrides:
            self.syncdb = self.syncconnection[overrides['db']]
        else:
            self.syncdb = self.syncconnection["test-thank"]
        self.syncconnection.close()
        
        
        # following part is for analyzer
        
        self.keywords_number = 10
        self._num_of_corpuses = 109 
        self.abstracts_filename = "../docs/abstracts/abstracts.xml"
        self.keywords_filename = "../docs/keywords/abstract_%s.txt"%self._num_of_corpuses
        self.ke = KeywordExtractor(self.abstracts_filename)

        

        self.f_obj = open(self.keywords_filename,'r')
        
        # set of all keywords
        self.keywords_set = pickle.load(self.f_obj)
        self.corpus = self.ke.get_corpus(109)


        # length of all keywords
        self.current_selected_keyword_length = len(list(self.keywords_set))
        # list of all keywords
        self.keywords_list = list(self.keywords_set)[:self.current_selected_keyword_length]
        
        # position of keywords pairs
        self.keywords_info = zip(self.keywords_list, range(0, self.current_selected_keyword_length))
        #self.keywords_info = zip(self.keywords_list, range(0, self.current_selected_keyword_length))
        
        # keywords after ranking
        self.ranked_keywords = deepcopy(self.keywords_list)
        # keywords after user input their preferences
        self.filtered_keywords = deepcopy(self.keywords_list)
        # selected keywords
        self.experienced_keywords = []
        # number of iteration
        self.iter_num = 0
        
        self.keywords = self.keywords_list[self.keywords_number * self.iter_num:self.keywords_number*(self.iter_num +1)]
        self.analyzer = Analyzer(self.keywords_list, self.corpus)
        self.f_obj.close()
        
    def __del__(self):
        super(tornado.web.Application, self).__del__(*args, **kwargs)



# to redirect log file run python with : --log_file_prefix=mylog
def main():
    tornado.options.parse_command_line()
    http_server = tornado.httpserver.HTTPServer(Application())
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == '__main__':
    main()
