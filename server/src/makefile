SASSC = sass

# Build stylesheets
STYLESRC = $(wildcard ./public/stylesheet/*.scss)
STYLEOBJ = ${STYLESRC:.scss=.css}
STYLEOUT = public/ui.css

$(STYLEOUT): $(STYLEOBJ)
	awk 'FNR==1{print ""}1' $^ > $@

%.css: %.scss
	$(SASSC) -C $< > $@

.PHONY: style
style: $(STYLEOUT)

.PHONY: all
all: style

.DEFAULT_GOAL := all

.PHONY: clean
clean:
	-rm $(STYLEOBJ)
	-rm $(STYLEOUT)
