sindice-dataset-spread-activation
========================

A Web-based UI that interactively displays spread activation of an RDF graph via SPARQL. The graph it will specifically work with is from Sindice.com and contains statistical/summary data about other RDF datasets.

A backend Node.js server (REST) performs the retrieval of the summary graph from Sindice and computes the spread activation model. This model (JSON) is then asynchronously (AJAX) sent to a HTML UI which renders the model as a three-dimensional graph. Rendering is done in the Three.js framework (presently with a Canvas).

Current demo available at: http://www.youtube.com/watch?v=WEhZ2OGj7u4&feature=youtu.be
