import docx
from docx.shared import Pt, Inches, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.enum.style import WD_STYLE_TYPE
import datetime

def setup_styles(doc):
    # Set default styling
    style = doc.styles['Normal']
    font = style.font
    font.name = 'Times New Roman'
    font.size = Pt(14)
    font.color.rgb = RGBColor(0, 0, 0)
    
    paragraph_format = style.paragraph_format
    paragraph_format.line_spacing_rule = WD_LINE_SPACING.ONE_POINT_FIVE
    paragraph_format.space_after = Pt(12)

    # Set up Heading 1
    h1 = doc.styles['Heading 1']
    h1_font = h1.font
    h1_font.name = 'Times New Roman'
    h1_font.size = Pt(16)
    h1_font.bold = True
    h1_font.color.rgb = RGBColor(0, 0, 0)
    h1.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    h1.paragraph_format.space_before = Pt(24)
    h1.paragraph_format.space_after = Pt(24)

    # Set up Heading 2
    h2 = doc.styles['Heading 2']
    h2_font = h2.font
    h2_font.name = 'Times New Roman'
    h2_font.size = Pt(14)
    h2_font.bold = True
    h2_font.color.rgb = RGBColor(0, 0, 0)
    h2.paragraph_format.space_before = Pt(18)
    h2.paragraph_format.space_after = Pt(12)

def add_cover_page(doc):
    # Title
    title = doc.add_paragraph("BEYOND CONVERGENCE: A LIGHTWEIGHT HUMAN-IN-THE-LOOP SEMANTIC CONFLICT TRIAGE FRAMEWORK FOR OFFLINE-FIRST CRDT-BASED COLLABORATIVE TEXT EDITING")
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title.runs[0].font.bold = True
    title.runs[0].font.size = Pt(18)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(24)
    
    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run1 = sub.add_run("A PROJECT REPORT\n\n")
    run1.font.size = Pt(14)
    run1.font.bold = True
    run2 = sub.add_run("Submitted by")
    run2.font.size = Pt(14)
    run2.font.bold = True
    run2.font.italic = True
    
    authors = doc.add_paragraph("RAM PRATHEESH S K\t230701258\nNAVEEN V\t\t\t230701207\nTARUN P\t\t\t230701401\nATHIRA D R\t\t230701047")
    authors.alignment = WD_ALIGN_PARAGRAPH.CENTER
    authors.runs[0].font.bold = True
    authors.runs[0].font.size = Pt(14)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(24)
    
    desc = doc.add_paragraph()
    desc.alignment = WD_ALIGN_PARAGRAPH.CENTER
    d_run1 = desc.add_run("in partial fulfillment for the award of the degree\nof\n")
    d_run1.font.italic = True
    d_run2 = desc.add_run("BACHELOR OF ENGINEERING\nIN\nCOMPUTER SCIENCE AND ENGINEERING")
    d_run2.font.bold = True
    
    doc.add_paragraph().paragraph_format.space_after = Pt(36)
    
    logo = doc.add_paragraph("[COLLEGE LOGO PLACEHOLDER]")
    logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
    logo.runs[0].font.bold = True
    
    doc.add_paragraph().paragraph_format.space_after = Pt(36)
    
    college = doc.add_paragraph("RAJALAKSHMI ENGINEERING COLLEGE, CHENNAI\nANNA UNIVERSITY: CHENNAI 600 025")
    college.alignment = WD_ALIGN_PARAGRAPH.CENTER
    college.runs[0].font.bold = True
    college.runs[0].font.size = Pt(16)
    
    date = doc.add_paragraph("September 2026")
    date.alignment = WD_ALIGN_PARAGRAPH.CENTER
    date.runs[0].font.bold = True
    
    doc.add_page_break()

def add_certificate(doc):
    title = doc.add_paragraph()
    title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    t_run1 = title.add_run("ANNA UNIVERSITY: CHENNAI 600 025\n\n")
    t_run1.font.bold = True
    t_run1.font.size = Pt(18)
    t_run2 = title.add_run("BONAFIDE CERTIFICATE")
    t_run2.font.bold = True
    t_run2.font.size = Pt(16)
    
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.DOUBLE
    p.add_run("Certified that this project report \"BEYOND CONVERGENCE: A LIGHTWEIGHT HUMAN-IN-THE-LOOP SEMANTIC CONFLICT TRIAGE FRAMEWORK FOR OFFLINE-FIRST CRDT-BASED COLLABORATIVE TEXT EDITING\" is the bonafide work of \"RAM PRATHEESH S K (230701258), NAVEEN V (230701207), TARUN P (230701401) and ATHIRA D R (230701047)\" who carried out the project work under my supervision.").font.size = Pt(14)
    
    doc.add_paragraph().paragraph_format.space_after = Pt(48)
    
    table = doc.add_table(rows=1, cols=2)
    table.alignment = WD_ALIGN_PARAGRAPH.CENTER
    row = table.rows[0]
    
    cell1 = row.cells[0]
    p1 = cell1.add_paragraph("SIGNATURE\n\nDr J. Manoranjini\nHEAD OF THE DEPARTMENT\nDepartment of Computer Science and Engineering\nRajalakshmi Engineering College\nChennai - 602 105")
    p1.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p1.runs[0].font.bold = True
    
    cell2 = row.cells[1]
    p2 = cell2.add_paragraph("SIGNATURE\n\nMr. J. Balachandar\nSUPERVISOR\nDepartment of Computer Science and Engineering\nRajalakshmi Engineering College\nChennai - 602 105")
    p2.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p2.runs[0].font.bold = True
    
    doc.add_paragraph("\nSubmitted for the project viva-voce examination held on 09.09.2026.")
    
    doc.add_paragraph().paragraph_format.space_after = Pt(48)
    
    table2 = doc.add_table(rows=1, cols=2)
    row2 = table2.rows[0]
    p_int = row2.cells[0].add_paragraph("INTERNAL EXAMINER")
    p_int.runs[0].font.bold = True
    p_ext = row2.cells[1].add_paragraph("EXTERNAL EXAMINER")
    p_ext.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    p_ext.runs[0].font.bold = True

    doc.add_page_break()

def add_abstract(doc):
    h = doc.add_heading("ABSTRACT", level=1)
    p = doc.add_paragraph()
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.DOUBLE
    p.add_run("Real-time collaborative document editing tools have become essential, yet traditional architectures rely heavily on a permanently reachable central server, causing disruptions when connectivity drops. This project introduces CollabX, a real-time collaborative rich-text editor designed using an offline-first approach built around Conflict-free Replicated Data Types (CRDTs), specifically leveraging the Yjs framework. In this environment, offline capabilities allow each client to retain a locally writable replica of the document, persisting edits in IndexedDB. When network connections are re-established, the editor synchronizes missing updates deterministically without centralized conflict resolution.\n\nHowever, ensuring mathematical convergence does not inherently guarantee semantic consistency. Collaborative users might introduce duplicate, complementary, contradictory, or independent edits while offline. To address this, the project proposes a lightweight human-in-the-loop semantic conflict triage framework. Once CRDT convergence is achieved, a post-synchronization module analyzes the concurrent edits using natural language processing (NLP), Sentence-BERT, bidirectional natural language inference, and large language models (LLMs). The framework intelligently categorizes semantic conflicts and escalates unresolved contradictions for manual review, significantly reducing the reviewer workload while ensuring safe collaborative editing.\n\nAdditionally, the system incorporates an innovative Inspection workflow. Designed for structural or physical inspections, this feature enables users to document isolated inspection reports collaboratively, tracking specific locations and statuses. The inspection data seamlessly integrates with the Yjs document state, preserving complex structural metadata and mitigating domain-specific semantic collisions. Experimental results demonstrate successful offline convergence, 100% data consistency, and robust AI-assisted semantic triage, proving that server-mediated CRDT architectures can achieve both high responsiveness and resilience while maintaining content integrity.")
    doc.add_page_break()
    
def add_acknowledgement(doc):
    doc.add_heading("ACKNOWLEDGEMENT", level=1)
    text = "We express our sincere gratitude to Dr. S.N. MURUGESAN, M.E., Ph.D., Principal, Rajalakshmi Engineering College, for providing us with the necessary facilities to carry out this project.\n\nWe are deeply thankful to Dr. J. Manoranjini, Head of the Department, Computer Science and Engineering, for the constant encouragement and departmental support extended throughout the course of this project.\n\nWe place on record our heartfelt gratitude to our project supervisor, Mr. J. Balachandar, Department of Computer Science and Engineering, for his valuable guidance, patience, and continuous support at every stage of the design, implementation, and documentation of this project.\n\nWe also thank our Project Coordinator for coordinating the review process and for the useful suggestions given during the periodic reviews.\n\nFinally, we thank our families and friends for their constant support and encouragement during the course of this project."
    p = doc.add_paragraph(text)
    p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.DOUBLE
    doc.add_paragraph("\nRAM PRATHEESH S K\nNAVEEN V\nTARUN P\nATHIRA D R").alignment = WD_ALIGN_PARAGRAPH.RIGHT
    doc.add_page_break()

def add_toc(doc):
    doc.add_heading("TABLE OF CONTENTS", level=1)
    doc.add_paragraph("[PLACEHOLDER - Generated Table of Contents]\n\nSince this is an automated document generation process, please update the Table of Contents field in MS Word by right-clicking this section and selecting 'Update Field', or by generating a new TOC.")
    doc.add_page_break()
    doc.add_heading("LIST OF FIGURES", level=1)
    doc.add_paragraph("[PLACEHOLDER - Generated List of Figures]")
    doc.add_page_break()
    doc.add_heading("LIST OF TABLES", level=1)
    doc.add_paragraph("[PLACEHOLDER - Generated List of Tables]")
    doc.add_page_break()
    doc.add_heading("LIST OF ABBREVIATIONS", level=1)
    doc.add_paragraph("CRDT\t\tConflict-free Replicated Data Type\nOT\t\tOperational Transformation\nLLM\t\tLarge Language Model\nNLP\t\tNatural Language Processing\nJWT\t\tJSON Web Token\nAPI\t\tApplication Programming Interface\nUI\t\tUser Interface\nDB\t\tDatabase\nws\t\tWebSocket\nJSON\t\tJavaScript Object Notation")
    doc.add_page_break()

def add_body(doc):
    # CHAPTER 1
    doc.add_heading("CHAPTER 1\nINTRODUCTION", level=1)
    doc.add_heading("1.1 GENERAL", level=2)
    doc.add_paragraph("Real-time collaborative editing has become a default expectation for document-based software: multiple users expect to open the same document, see each other's cursors, and have their edits appear for everyone almost instantly. Tools such as Google Docs popularized this model, but their architecture depends on a continuously reachable central server. When a client loses connectivity, most such editors either block editing entirely or silently fall back to a private, unsynchronized copy that has to be reconciled by hand once the connection returns. This creates a poor experience in situations with unstable networks or intermittent connectivity.")
    doc.add_paragraph("This project, CollabX, implements an offline-first, real-time collaborative rich-text document editor built around Conflict-free Replicated Data Types (CRDTs). Instead of treating offline editing as an exception, the system allows every client to hold a locally-writable replica of the document. Edits are captured immediately regardless of connectivity, and reconciliation between replicas happens automatically and deterministically when clients reconnect. However, while convergence guarantees a synchronized state, it does not guarantee semantic correctness. Therefore, we integrate a semantic conflict triage framework to handle content collisions.")
    
    doc.add_heading("1.2 OBJECTIVES", level=2)
    doc.add_paragraph("The main objective of the proposed system is to provide a robust collaborative editor coupled with an intelligent mechanism to process and resolve semantic conflicts. The specific objectives include:\n"
                      "1. To design and implement a server-mediated, CRDT-based real-time collaborative rich-text editor using Yjs.\n"
                      "2. To support offline-first editing, where local edits are captured and persisted using IndexedDB.\n"
                      "3. To automatically reconnect and resynchronize to restore document convergence.\n"
                      "4. To deploy a human-in-the-loop semantic conflict triage framework utilizing NLP and LLMs to identify duplicate, complementary, and contradictory edits.\n"
                      "5. To integrate a collaborative Inspection workflow that tracks structured spatial metadata alongside the rich-text edits, demonstrating real-world domain applicability.")

    doc.add_heading("1.3 EXISTING SYSTEM", level=2)
    doc.add_paragraph("Existing collaborative editors rely primarily on Operational Transformation (OT) or basic CRDTs to ensure deterministic state convergence. Systems leveraging OT require a central server for operation serialization, making offline editing fragile and complex to implement. While local-first architectures using CRDTs provide eventual consistency, they blindly merge concurrent updates. This often results in a document containing redundant text (duplicates), inconsistent facts (contradictions), or poorly arranged statements (semantic collisions).")

    doc.add_heading("1.4 PROPOSED SYSTEM", level=2)
    doc.add_paragraph("The proposed system goes beyond convergence by implementing an offline-first CRDT foundation (via Yjs) combined with a post-synchronization semantic layer. The Yjs document securely tracks local edits and reconnects using WebSockets. After CRDT convergence is guaranteed, a backend worker processes the concurrent edits using Sentence-BERT embeddings, bidirectional natural language inference, and localized LLM reasoning to classify the relationship of the edits. Conflicts are triaged, and contradictions are escalated to a human reviewer to resolve.")
    doc.add_paragraph("In addition, an Inspection feature is introduced to handle structured observation reports. Inspectors can perform localized data capture (e.g., location statuses, metadata) offline, which is later securely synchronized and processed through the semantic conflict triage framework, preventing logical contradictions in mission-critical reporting.")

    # CHAPTER 2
    doc.add_heading("CHAPTER 2\nLITERATURE SURVEY", level=1)
    doc.add_heading("2.1 LITERATURE REVIEW", level=2)
    doc.add_paragraph("Sun and Ellis (1998) formalized Operational Transformation (OT) for real-time group editors, describing algorithms that require transformation functions to achieve convergence. OT underlies tools like Google Docs, but extending it for rich, nested document structures in fully offline settings remains difficult.")
    doc.add_paragraph("Shapiro, Preguiça, Baquero and Zawirski (2011) introduced Conflict-free Replicated Data Types, formalizing state-based and operation-based replication. CRDTs guarantee strong eventual consistency without coordination, becoming the foundational logic for Yjs and this project.")
    doc.add_paragraph("Kleppmann, Wiggins, van Hardenberg and McGranaghan (2019) articulated the 'local-first software' ideals, advocating for applications that grant users fast, offline-capable access to local data that synchronizes opportunistically. ")
    doc.add_paragraph("Recent research on semantic reconciliation highlights a gap. Gu et al. used domain ontologies to resolve conflicts, but these do not directly translate to casual rich-text editing. Natural language processing, particularly models like Sentence-BERT (Reimers and Gurevych, 2019) and NLI classifiers, provides a modern methodology for evaluating text pairs without expensive generation tasks.")

    doc.add_heading("2.2 CONCLUSION", level=2)
    doc.add_paragraph("The literature shows a clear division: collaborative data structures successfully solve the problem of state synchronization, while NLP techniques successfully evaluate semantic meaning. However, integrating these into a single collaborative editor with offline-first capabilities remains largely unexplored. This project fills that gap by layering semantic triage directly over CRDT convergence and applying it to a robust Inspection application.")

    # CHAPTER 3
    doc.add_heading("CHAPTER 3\nSYSTEM DESIGN", level=1)
    doc.add_heading("3.1 SYSTEM ARCHITECTURE", level=2)
    doc.add_paragraph("CollabX operates as a server-mediated collaborative editor. The Node.js/Express backend provides a WebSocket relay and persists Yjs updates to MongoDB Atlas. Clients render the TipTap/ProseMirror editor and bind it to a local Yjs document instance. Modifications occur locally without network dependency and are immediately persisted in IndexedDB.")
    doc.add_paragraph("\n[FIGURE PLACEHOLDER – SYSTEM ARCHITECTURE DIAGRAM]\n")
    doc.add_paragraph("For the semantic conflict triage, the framework introduces a post-convergence pipeline. Concurrent edit spans are extracted via causal metadata. They undergo lightweight pruning and Sentence-BERT analysis. If similarity thresholds demand, bidirectional natural language inference assesses contradiction probabilities. Unresolved cases are escalated to an LLM, generating a justification and passing it to the human-in-the-loop review interface.")

    doc.add_heading("3.2 SYSTEM REQUIREMENTS", level=2)
    doc.add_paragraph("Hardware Requirements:\n- Processor: Multi-core processor (Intel i5/i7 or equivalent)\n- RAM: 8GB or higher\n- Network: Stable internet connection for initial load and synchronization.\n\nSoftware Requirements:\n- Frontend: React 19, TypeScript, TipTap v3 (ProseMirror)\n- Backend: Node.js, Express, WebSocket (ws)\n- Database: MongoDB Atlas, IndexedDB (Client)\n- Libraries: Yjs, y-prosemirror, y-indexeddb, y-protocols/awareness\n- AI Integration: Gemini API for text summarization and LLM semantic triage")

    doc.add_heading("3.3 MODULE DESCRIPTION", level=2)
    doc.add_paragraph("1. Core Editing and Synchronization Module: Uses TipTap editor bound to a Yjs document. Changes are persisted locally via y-indexeddb and synced over WebSockets when online.\n2. Semantic Conflict Triage Module: Captures concurrent edit metadata. Employs a cascading four-class evaluation (duplicate, complementary, contradictory, independent) using Sentence-BERT and LLM to intelligently reduce manual merge decisions.\n3. Inspection Workflow Module: Specialized module for physical or structural reporting. Users can create `Inspection` resources, which track `InspectionLocation` statuses and rich-text observations. This structured metadata is persisted in the Yjs document and the relational database to enable domain-specific collaboration.")

    # CHAPTER 4
    doc.add_heading("CHAPTER 4\nPROJECT DESCRIPTION AND METHODOLOGY", level=1)
    doc.add_heading("4.1 IMPLEMENTATION OF CRDT AND OFFLINE FIRST", level=2)
    doc.add_paragraph("The rich-text input is translated by y-prosemirror into CRDT operations. When offline, y-indexeddb captures these updates. Once a connection is restored via an exponential backoff strategy, state vectors are exchanged with the server. Missing updates are applied locally, and the editor is re-rendered to reflect the converged document state.")

    doc.add_heading("4.2 IMPLEMENTATION OF SEMANTIC TRIAGE", level=2)
    doc.add_paragraph("The triage system separates semantic compatibility from CRDT convergence. The taxonomy assigns concurrent-edit pairs into four operational relations:\n- Duplicate: Edits with the same semantic effect. The system may auto-pass or suggest deduplication.\n- Complementary: Compatible additions enriching the same topic. Preserved together.\n- Contradictory: Claims that cannot safely coexist. Mandatory human verification is required.\n- Independent: Different semantic targets. Automatically preserved.")

    doc.add_heading("4.3 THE INSPECTION FEATURE", level=2)
    doc.add_paragraph("The Inspection feature demonstrates real-world applicability of the offline-first collaborative framework. Inspectors often operate in environments with poor network connectivity (e.g., construction sites). The module defines an `Inspection` schema capturing title, description, and status, and `InspectionLocation` schemas capturing localized reports. These elements sync through the core CRDT network.")
    doc.add_paragraph("\n[FIGURE PLACEHOLDER – INSPECTION WORKFLOW]\n")
    doc.add_paragraph("When multiple inspectors evaluate the same location and return online, their reports converge. The semantic module explicitly watches the Inspection feature's data structure to detect if two users logged conflicting statuses (e.g., 'Passed' vs 'Failed') or conflicting textual observations for the exact same location, triggering a manual review for the inspection supervisor.")

    # CHAPTER 5
    doc.add_heading("CHAPTER 5\nRESULTS AND DISCUSSION", level=1)
    doc.add_heading("5.1 EXPERIMENTAL SETUP", level=2)
    doc.add_paragraph("The application was tested across various configurations, involving single and multi-client offline editing, simulated network disconnections, and increasing concurrent user loads. Real-time monitoring panels captured metrics such as sync latency, document consistency, merge success rates, and message payload sizes.")

    doc.add_heading("5.2 CONVERGENCE AND OFFLINE RECOVERY", level=2)
    doc.add_paragraph("During functional evaluations, clients successfully created divergent edits while offline. Upon reconnection, 100% of merge attempts succeeded without application failure, and 100% document consistency was observed across all replicas. In scalability tests with up to 20 concurrent users, the average synchronization latency remained consistently low, ranging from 44.51 ms (2 users) to 12.68 ms (20 users).")

    doc.add_heading("5.3 SEMANTIC CONFLICT TRIAGE PERFORMANCE", level=2)
    doc.add_paragraph("The semantic triage framework was evaluated on a corpus of 300 Wikipedia-derived concurrent edit revisions. The full-cascade system (using structural pruning, embeddings, and selective LLM prompts) achieved an 80.7% LLM-avoidance coverage, successfully classifying the majority of safe edits without invoking an expensive language model. Crucially, the contradiction recall reached 87.3%, proving the framework's effectiveness in catching contradictory edits and routing them to human reviewers.")

    # CHAPTER 6
    doc.add_heading("CHAPTER 6\nCONCLUSION AND FUTURE WORK", level=1)
    doc.add_heading("6.1 CONCLUSION", level=2)
    doc.add_paragraph("This project successfully implemented CollabX, a robust offline-first, real-time collaborative document editor. By leveraging the Yjs CRDT framework, the system provides uninterrupted editing during network failures and deterministic synchronization upon reconnection. The integration of the lightweight human-in-the-loop semantic conflict triage framework directly addresses the semantic inaccuracies introduced by blind CRDT merging. By escalating only contradictory or high-risk edits, the system maintains document integrity while minimizing reviewer workload. The implementation of the Inspection module further validates the architecture for complex, domain-specific collaborative environments.")

    doc.add_heading("6.2 FUTURE WORK", level=2)
    doc.add_paragraph("Future enhancements could involve extending the scalability evaluation to larger workloads and examining peer-to-peer (WebRTC) synchronization topologies to decrease reliance on the central WebSocket server. Furthermore, the semantic framework can be extended to include longer document-level dependency tracking and context-aware auto-resolution models to further reduce human-in-the-loop interventions.")

    # REFERENCES
    doc.add_heading("REFERENCES", level=1)
    refs = [
        "Sun, C. and Ellis, C. (1998) 'Operational transformation in real-time group editors: issues, algorithms, and achievements', Proceedings of the ACM Conference on Computer Supported Cooperative Work (CSCW 1998), Seattle, WA, pp. 59-68.",
        "Shapiro, M., Preguiça, N., Baquero, C. and Zawirski, M. (2011) 'Conflict-free replicated data types', Proceedings of the 13th International Symposium on Stabilization, Safety, and Security of Distributed Systems (SSS 2011), Grenoble, France, pp. 386-400.",
        "Kleppmann, M., Wiggins, A., van Hardenberg, P. and McGranaghan, M. (2019) 'Local-first software: you own your data, in spite of the cloud', Proceedings of the 2019 ACM SIGPLAN International Symposium on New Ideas, New Paradigms, and Reflections on Programming and Software (Onward! 2019), Athens, Greece, pp. 154-178.",
        "Yang, D., Halfaker, A., Kraut, R. and Hovy, E. (2017) 'Identifying semantic edit intentions from revisions in Wikipedia', Proc. 2017 Conf. Empirical Methods in Natural Language Processing (EMNLP), pp. 2000-2010.",
        "Reimers, N. and Gurevych, I. (2019) 'Sentence-BERT: Sentence embeddings using Siamese BERT-networks', Proc. EMNLP-IJCNLP, 2019, pp. 3982-3992."
    ]
    
    for r in refs:
        p = doc.add_paragraph(r)
        p.paragraph_format.line_spacing_rule = WD_LINE_SPACING.SINGLE
        p.paragraph_format.space_after = Pt(12)

def generate_report():
    doc = docx.Document()
    setup_styles(doc)
    add_cover_page(doc)
    add_certificate(doc)
    add_abstract(doc)
    add_acknowledgement(doc)
    add_toc(doc)
    add_body(doc)
    doc.save(r"d:\Downloads\My Apps(Built Ones)\Final Year Project\Final_Year_Project_Report.docx")

if __name__ == '__main__':
    generate_report()
